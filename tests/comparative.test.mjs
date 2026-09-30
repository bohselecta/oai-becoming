import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  initialState, isState, estimate, evidenceExclusion, becomingIndex, dimensionStandings,
  comparison, percentile, cohortPeople, cohortValues, participantEstimate, comparePeople,
  justAhead, createProject, projectTarget, adopt, replayAssessment, reviewEvidence,
  revokeEvidence, setSource, movement, disclosure, projectBrief, skills, dimensions,
  participants, cohorts, RUBRIC, PROTOCOL, REFERENCE_VERSION, RECENCY_DAYS, MAX_SAMPLES,
} from '../src/domain.js';

const close = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} differs from ${b}`);
const clone = value => structuredClone(value);
function complete(state,project=state.projects[0]) {
  project.steps=[true,true,true];
  const evidence=replayAssessment(state,project.id,project.target.mode);
  reviewEvidence(state,evidence.id,'accepted');
  return evidence;
}
function setMarks(state,mark) {state.evidence.forEach(e=>{e.mark=mark;});return state;}

test('the Becoming Index is calculated, not the mockup example number',()=>{
  const s=initialState(),i=becomingIndex(s);
  close(i.score,597.2222222222223);assert.equal(i.coverage,100);assert.equal(i.percentile,48);
  assert.equal(i.asOf,'2026-09-30');assert.equal(i.version,'becoming-index/2');
});
test('index weights decompose exactly into six equal capabilities',()=>{
  const i=becomingIndex(initialState());close(dimensions.reduce((n,d)=>n+d.weight,0),1);
  for(const c of i.components)close(c.weight,1/6);
  close(i.score,i.components.reduce((n,c)=>n+c.score*250*c.weight,0));
});
test('a chosen aspiration cannot silently reweight the Becoming Index',()=>{
  const s=initialState(),before=becomingIndex(s);s.goal='create';
  assert.deepEqual(becomingIndex(s),before);
});
test('cohort changes relative standing without changing ability or evidence',()=>{
  const s=initialState(),data=JSON.stringify(s.evidence),before=becomingIndex(s),history=JSON.stringify(s.history);
  s.cohort='senior';const after=becomingIndex(s);
  close(after.score,before.score);assert.notEqual(after.percentile,before.percentile);
  assert.equal(JSON.stringify(s.evidence),data);assert.equal(JSON.stringify(s.history),history);
});
test('all eight named populations have the documented exact membership',()=>{
  for(const c of cohorts){const people=cohortPeople(c.id);assert.equal(people.length,c.n);assert.equal(new Set(people.map(p=>p.id)).size,c.n);}
  assert.equal(participants.length,120);assert.ok(participants.every(p=>p.synthetic&&p.kind==='synthetic'));
});
test('small cohort suppresses composite, dimension and capability percentiles',()=>{
  const s=initialState();s.cohort='circle';assert.equal(becomingIndex(s).percentile,null);
  assert.equal(comparison(s,'research').available,false);
  assert.ok(dimensionStandings(s).every(d=>d.percentile===null));
});
test('an authorized individual comparison need not imply a valid population rank',()=>{
  const s=initialState();s.cohort='circle';const person=cohortPeople('circle')[5];
  assert.equal(comparePeople(s,person).available,true);assert.equal(becomingIndex(s).available,false);
});
test('unsupported domains stay unknown rather than receiving invented measurements',()=>{
  const s=initialState();for(const id of ['wealth','health','relationships','personality'])assert.equal(estimate(s,id).score,null);
  assert.equal(becomingIndex(s).components.length,6);
});
test('missing capabilities change coverage, not a hidden zero penalty',()=>{
  const s=initialState();s.evidence=s.evidence.filter(e=>e.skill==='systems');const i=becomingIndex(s);
  assert.deepEqual(i.basket,['systems']);assert.equal(i.coverage,17);assert.equal(i.partial,true);
  close(i.score,estimate(s,'systems').score*250);assert.equal(estimate(s,'research').score,null);
});
test('partial composite uses the same observed basket for each comparator',()=>{
  const s=initialState();setSource(s,'projects',false);const i=becomingIndex(s);
  const values=cohortPeople(s.cohort).map(p=>i.basket.reduce((n,id)=>n+participantEstimate(p,id,s.mode,s.asOf),0)/i.basket.length*250);
  assert.equal(i.percentile,percentile(i.score,values));assert.equal(i.coverage,67);
});
test('no evidence produces no index, percentile or observed envelope',()=>{
  const s=initialState();s.evidence=[];const i=becomingIndex(s);
  assert.equal(i.score,null);assert.equal(i.range,null);assert.equal(i.percentile,null);assert.equal(i.coverage,0);
});
test('a valid observed zero is distinct from an unknown',()=>{
  const s=setMarks(initialState(),0);assert.equal(estimate(s,'research').score,0);
  assert.equal(becomingIndex(s).score,0);assert.equal(becomingIndex(s).coverage,100);assert.equal(becomingIndex(s).percentile,0);
});
test('low placement remains a literal low percentile',()=>{
  const s=initialState();assert.equal(comparison(s,'creative').percentile,13);
  assert.equal(comparison(s,'creative').stronger,104);
});
test('high endpoint is calculated with ties rather than a fake perfect rank',()=>{
  const s=setMarks(initialState(),4),i=becomingIndex(s);
  assert.equal(i.score,1000);assert.equal(i.percentile,percentile(1000,cohortPeople(s.cohort).map(p=>skills.reduce((n,k)=>n+participantEstimate(p,k.id,s.mode),0)/6*250)));
});
test('fewer than three demonstrations never becomes a zero score',()=>{
  const s=initialState();s.evidence=s.evidence.filter(e=>e.skill!=='research'||!e.id.endsWith('-2'));
  assert.equal(estimate(s,'research').n,2);assert.equal(estimate(s,'research').score,null);assert.equal(becomingIndex(s).coverage,83);
});
test('recency includes the exact boundary and excludes older or future records',()=>{
  const s=initialState(),e=s.evidence[0],day=86400000;
  e.date=new Date(Date.parse(s.asOf)-RECENCY_DAYS*day).toISOString().slice(0,10);assert.equal(evidenceExclusion(s,e),null);
  e.date=new Date(Date.parse(s.asOf)-(RECENCY_DAYS+1)*day).toISOString().slice(0,10);assert.match(evidenceExclusion(s,e),/window/);
  e.date='2026-10-01';assert.match(evidenceExclusion(s,e),/window/);
});
test('rubric and protocol incompatibilities are rejected at the human review gate',()=>{
  for(const field of ['rubric','protocol']){const s=initialState(),e=s.evidence.find(e=>e.status==='pending'),before=becomingIndex(s).score;e[field]='incompatible/99';assert.throws(()=>reviewEvidence(s,e.id,'accepted'),/version/);assert.equal(e.status,'pending');close(becomingIndex(s).score,before);}
});
test('duplicate demonstration provenance cannot inflate evidence coverage',()=>{
  const s=initialState(),e=s.evidence.find(e=>e.skill==='research'&&e.mode==='independent');
  s.evidence.push({...e,id:'duplicate-record'});assert.equal(estimate(s,'research').n,3);
});
test('only the latest twelve distinct eligible demonstrations are averaged',()=>{
  const s=initialState(),base=s.evidence.find(e=>e.skill==='research'&&e.mode==='independent');
  for(let i=0;i<15;i++)s.evidence.push({...base,id:`new-${i}`,demonstrationId:`new-${i}`,date:'2026-09-30',mark:4});
  assert.equal(estimate(s,'research').n,MAX_SAMPLES);assert.equal(estimate(s,'research').score,4);
});
test('estimate computation never reorders or mutates source records',()=>{
  const s=initialState(),before=JSON.stringify(s.evidence);becomingIndex(s);comparison(s,'research');justAhead(s,'research');
  assert.equal(JSON.stringify(s.evidence),before);
});
test('accepted independent evidence cannot update the assisted profile',()=>{
  const s=initialState(),before=becomingIndex({...s,mode:'assisted'});complete(s);
  assert.deepEqual(becomingIndex({...s,mode:'assisted'}),before);assert.equal(movement({...s,mode:'assisted'}).points,0);
});
test('revocation propagates to both modes and every dependent composite',()=>{
  const s=initialState();setSource(s,'projects',false);
  for(const mode of ['independent','assisted']){const view={...s,mode};assert.equal(estimate(view,'systems').score,null);assert.equal(estimate(view,'research').score,null);assert.equal(becomingIndex(view).coverage,67);}
});
test('restoring a source adds no evidence and does not undo individual revocation',()=>{
  const s=initialState(),e=s.evidence[0],count=s.evidence.length;revokeEvidence(s,e.id);setSource(s,e.source,false);setSource(s,e.source,true);
  assert.equal(s.evidence.length,count);assert.equal(e.status,'revoked');assert.ok(!estimate(s,e.skill,e.mode).evidence.includes(e));
});
test('repeated unchanged source grants do not manufacture trajectory events',()=>{
  const s=initialState(),n=s.history.length;setSource(s,'projects',true);assert.equal(s.history.length,n);
});
test('revocation rejects pending or already-revoked records',()=>{
  const s=initialState();assert.throws(()=>revokeEvidence(s,'candidate-story'));const e=s.evidence[0];revokeEvidence(s,e.id);assert.throws(()=>revokeEvidence(s,e.id));
});
test('an unauthorized comparator has no usable estimate or comparison',()=>{
  const s=initialState(),p=clone(participants[0]);p.permission.compare=false;
  assert.equal(participantEstimate(p,'research','independent'),null);assert.equal(comparePeople(s,p).available,false);
});
test('reference version, protocol, assistance and observation date must match',()=>{
  for(const mutate of [p=>p.referenceVersion='wrong/1',p=>p.observations.independent.research.protocol='wrong/1',p=>p.observations.independent.research.mode='assisted',p=>p.observations.independent.research.observedAt='2027-01-01']){
    const p=clone(participants[0]);mutate(p);assert.equal(participantEstimate(p,'research','independent'),null);
  }
});
test('participant estimates reject malformed, sparse or invalid mark arrays',()=>{
  for(const marks of [[1,2],[1,2,NaN],[1,2,4.5],[1,2,-1],null]){const p=clone(participants[0]);p.observations.independent.research.marks=marks;assert.equal(participantEstimate(p,'research','independent'),null);}
});
test('a person outside the selected population is not quietly swapped into it',()=>{
  const s=initialState();s.cohort='senior';assert.equal(comparePeople(s,participants[0]).available,false);
  assert.throws(()=>createProject(s,{skill:'research',title:'Invalid membership',personId:participants[0].id}));
});
test('a nonexistent explicit comparator is rejected rather than replaced with a threshold',()=>{
  assert.throws(()=>createProject(initialState(),{skill:'research',title:'Missing person',personId:'not-a-person'}),/does not exist/);
});
test('nearest-ahead is the smallest positive compatible gap with deterministic tie handling',()=>{
  const s=initialState();for(const mode of ['independent','assisted'])for(const cohort of ['global','national','senior','aspiration']){
    s.mode=mode;s.cohort=cohort;const own=estimate(s,'research').score,next=justAhead(s,'research');
    const scores=cohortValues('research',mode,cohort).filter(v=>v>own+1e-7);
    assert.equal(next?.score??null,scores.length?Math.min(...scores):null);
    if(next){assert.equal(next.person.cohorts.includes(cohort),true);close(next.gap,next.score-own);}
  }
});
test('no person ahead and no baseline produce honest empty states',()=>{
  const s=setMarks(initialState(),4);assert.equal(justAhead(s,'research'),null);s.evidence=[];assert.equal(justAhead(s,'research'),null);
});
test('Compare Us exposes only the six measured capability gaps',()=>{
  const s=initialState(),p=justAhead(s,'research').person,r=comparePeople(s,p);
  assert.deepEqual(r.rows.map(r=>r.skill),skills.map(s=>s.id));for(const row of r.rows)close(row.gap,row.theirs-row.yours);
  assert.ok(r.gaps.every((g,i,a)=>g.gap>0&&(i===0||a[i-1].gap>=g.gap)));
});
test('a Surpass Project freezes context, current evidence and assistance',()=>{
  const s=initialState(),p=createProject(s,{skill:'research',title:'A frozen comparison'}),before=clone(p.target);
  s.cohort='senior';s.mode='assisted';s.goal='clarity';assert.deepEqual(p.target,before);
  assert.equal(p.target.rubric,RUBRIC);assert.equal(p.target.protocol,PROTOCOL);assert.equal(p.target.referenceVersion,REFERENCE_VERSION);
  assert.equal(p.target.evidenceIds.length,3);assert.ok(p.target.targetScore>p.target.referenceScore);
});
test('small and paused populations cannot promise a percentile target',()=>{
  const s=initialState();s.cohort='circle';assert.equal(projectTarget(s,'research').targetPercentile,null);
  s.cohort='global';s.benchmarkVisible=false;assert.equal(projectTarget(s,'research').targetPercentile,null);
});
test('a ceiling comparator is explicitly a ceiling match, not an impossible score',()=>{
  const s=initialState(),person=participants.find(p=>participantEstimate(p,'systems','independent')===4);
  assert.ok(person);const t=projectTarget(s,'systems',person.id);assert.equal(t.targetScore,4);assert.equal(t.relation,'match-ceiling');assert.match(t.success,/matches the rubric ceiling/);
});
test('project checklist completion changes neither evidence, index, rank nor history',()=>{
  const s=initialState(),before=becomingIndex(s),history=JSON.stringify(s.history);s.projects[0].steps=[true,true,true];
  assert.deepEqual(becomingIndex(s),before);assert.equal(JSON.stringify(s.history),history);
});
test('a pending demonstration changes neither estimates nor trajectory',()=>{
  const s=initialState(),before=becomingIndex(s),n=s.history.length;s.projects[0].steps=[true,true,true];replayAssessment(s,s.projects[0].id,'independent');
  assert.deepEqual(becomingIndex(s),before);assert.equal(s.history.length,n);
});
test('the accepted demonstration moves score and relative rank legitimately',()=>{
  const s=initialState(),before=becomingIndex(s);complete(s);const after=becomingIndex(s);
  close(after.score,614.5833333333335);assert.equal(after.percentile,49);assert.ok(after.score>before.score);assert.equal(s.projects[0].status,'complete');
  close(movement(s).points,after.score-before.score);assert.equal(movement(s).percentilePoints,1);
});
test('accepting a below-target demonstration cannot complete a Surpass Project',()=>{
  const s=initialState();s.projects[0].steps=[true,true,true];const e=replayAssessment(s,s.projects[0].id,'independent');e.mark=0;reviewEvidence(s,e.id,'accepted');assert.equal(s.projects[0].status,'active');
});
test('revoking the qualifying demonstration reopens its project and reverses movement',()=>{
  const s=initialState(),before=becomingIndex(s),e=complete(s);revokeEvidence(s,e.id);
  assert.equal(s.projects[0].status,'active');close(becomingIndex(s).score,before.score);assert.equal(movement(s).percentilePoints,0);
});
test('replay must use the project condition even after the interface mode switches',()=>{
  const s=initialState();s.projects[0].steps=[true,true,true];s.mode='assisted';assert.throws(()=>replayAssessment(s,s.projects[0].id,s.mode),/frozen/);
});
test('Perspective adoption freezes practices and target but transfers no rank',()=>{
  const s=initialState(),before=becomingIndex(s),history=JSON.stringify(s.history),person=justAhead(s,'research').person;
  const p=adopt(s,'investigator',[0,2],person.id);assert.deepEqual(p.origin.practices,[0,2]);assert.equal(p.target.personId,person.id);
  assert.deepEqual(becomingIndex(s),before);assert.equal(JSON.stringify(s.history),history);
});
test('a person cannot donate a practice they have not shared',()=>{
  const s=initialState(),p=participants.find(p=>!p.sharedBundles.includes('storyteller'));
  assert.throws(()=>adopt(s,'storyteller',[0],p.id),/not shared/);
});
test('invalid practice provenance is rejected before creating a project',()=>{
  const s=initialState();assert.throws(()=>createProject(s,{skill:'research',title:'Bad provenance',origin:{bundle:'unknown',version:'1.0',practices:[0]}}));
});
test('dated starting snapshots contain only evidence observed by that date',()=>{
  const s=initialState();for(const snapshot of s.history)for(const mode of ['independent','assisted']){
    const view={...s,asOf:snapshot.date,mode},i=becomingIndex(view);close(snapshot.modes[mode].score,i.score);
    assert.deepEqual(snapshot.modes[mode].basket,i.basket);
  }
  assert.equal(s.history[0].modes.independent.percentiles.global,null);
});
test('accepted evidence creates a derived snapshot, not invented history',()=>{
  const s=initialState(),n=s.history.length;complete(s);assert.equal(s.history.length,n+1);
  close(s.history.at(-1).modes.independent.score,becomingIndex(s).score);assert.equal(s.history.at(-1).modes.independent.percentiles.global,becomingIndex(s).percentile);
});
test('rejected evidence does not add a measurement snapshot',()=>{
  const s=initialState(),n=s.history.length;reviewEvidence(s,'candidate-story','rejected');assert.equal(s.history.length,n);
});
test('movement uses the first comparable rank snapshot, not an unavailable early percentile',()=>{
  const s=initialState();assert.equal(movement(s).percentileBaseline.date,'2026-09-30');assert.equal(movement(s).percentilePoints,0);complete(s);assert.equal(movement(s).percentilePoints,1);
});
test('incompatible reference histories cannot be reported as movement',()=>{
  const s=initialState();s.history.forEach(h=>h.referenceVersion='different-reference');assert.equal(movement(s).points,null);assert.equal(movement(s).percentilePoints,null);
});
test('coverage changes are not mistaken for same-basket improvement',()=>{
  const s=initialState();setSource(s,'practice',false);const m=movement(s);
  assert.deepEqual(m.baseline.modes.independent.basket,becomingIndex(s).basket);assert.equal(m.points,0);
});
test('paused comparisons suppress nearest people, profile comparisons and disclosure ranks',()=>{
  const s=initialState();s.benchmarkVisible=false;assert.equal(justAhead(s,'research'),null);assert.equal(comparePeople(s,participants[0]).available,false);
  assert.ok(disclosure(s).indices.every(i=>i.percentile===null));assert.equal(movement(s).percentilePoints,null);
});
test('export and brief include the contract without exporting hidden notes or raw evidence',()=>{
  const s=initialState();s.projects[0].reflection='PRIVATE-NOTE';s.evidence[0].reviewNote='PRIVATE-REVIEW';const packet=JSON.stringify(disclosure(s));
  assert.ok(!packet.includes('PRIVATE-'));assert.ok(!packet.includes('fixture://'));assert.ok(projectBrief(s.projects[0]).includes('Frozen evidence contract'));
  assert.ok(projectBrief(s.projects[0]).includes(s.projects[0].target.personName));
});
test('post-review and revocation session roundtrips with full frozen contracts',()=>{
  const s=initialState(),e=complete(s);revokeEvidence(s,e.id);setSource(s,'portfolio',false);assert.ok(isState(JSON.parse(JSON.stringify(s))));
});
test('persistence rejects malformed target values instead of treating them as numbers',()=>{
  for(const field of ['initialScore','referenceScore','targetScore','initialPercentile','targetPercentile']){const s=initialState();s.projects[0].target[field]='not a number';assert.equal(isState(s),false);}
});
test('persistence rejects malformed history and duplicate adoption identities',()=>{
  const s=initialState();s.history[0].modes.independent.capabilities.systems.score=-1;assert.equal(isState(s),false);
  const a=initialState();adopt(a,'builder',[0]);a.adopted.push(clone(a.adopted[0]));assert.equal(isState(a),false);
});
test('new score displays never substitute an unknown percentile marker at zero',()=>{
  const code=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(code,/index\.percentile\?\?0/);assert.doesNotMatch(code,/h\.modes\[state\.mode\]\.score\?\?0/);
  assert.match(code,/points\.map/);assert.match(code,/p\.y===null\?'':/);
});
