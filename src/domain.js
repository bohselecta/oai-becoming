/** Becoming measurement engine. Arithmetic is inspectable, not scientifically calibrated.
 * The original six capabilities, rubric, human-review gate and pure-function chassis
 * are retained from Becoming v0.1. New comparisons use explicit participant records.
 */
import {participants, referenceCohorts, REFERENCE_VERSION, REFERENCE_DATE, PROTOCOL} from './participants.js';
export {participants, REFERENCE_VERSION, PROTOCOL};
export const VERSION = 2;
export const RUBRIC = 'becoming-demo/1';
export const INDEX_VERSION = 'becoming-index/2';
export const MIN_EVIDENCE = 3;
export const MIN_COHORT = 30;
export const RECENCY_DAYS = 180;
export const MAX_SAMPLES = 12;
export const skills = [
  { id:'systems', name:'Systems thinking', category:'Thinking', icon:'orbit', color:'mint', x:51, y:22, target:3.5, summary:'See relationships. Find the leverage point.', criterion:'Map dependencies, identify one constraint, and test a change against a stated outcome.', practice:'Map a system before changing it', marks:[3,3,4], source:'projects' },
  { id:'research', name:'Research judgment', category:'Thinking', icon:'search', color:'blue', x:21, y:46, target:3, summary:'Turn information into a defensible decision.', criterion:'Triangulate a claim with independent sources, disclose uncertainty, and explain what would change the decision.', practice:'Make a decision from conflicting evidence', marks:[2,2,3], source:'projects' },
  { id:'story', name:'Clear storytelling', category:'Creating', icon:'voice', color:'peach', x:76, y:48, target:3.5, summary:'Make the important thing understood.', criterion:'Explain a complex idea to a named audience, retain the key trade-off, and check understanding.', practice:'Explain one complex idea in 90 seconds', marks:[2,3,3], source:'portfolio' },
  { id:'prototype', name:'Rapid prototyping', category:'Creating', icon:'box', color:'lilac', x:48, y:79, target:3.5, summary:'Make an idea tangible enough to test.', criterion:'Build a testable artifact with explicit assumptions, gather feedback, and revise one core assumption.', practice:'Build the smallest useful experiment', marks:[3,3,3], source:'portfolio' },
  { id:'facilitation', name:'Facilitation', category:'Collaborating', icon:'people', color:'sand', x:14, y:77, target:3, summary:'Help a group think better together.', criterion:'Design an inclusive agenda, preserve dissent, and produce a shared next action. No personality or emotion inference.', practice:'Design a meeting worth having', marks:[1,2,2], source:'practice' },
  { id:'creative', name:'Creative coding', category:'Creating', icon:'code', color:'mint', x:86, y:79, target:3, summary:'Give an imaginative idea working form.', criterion:'Implement a small interactive behavior, explain the code, and adapt it to an unseen constraint.', practice:'Make a tiny idea interactive', marks:[1,1,2], source:'practice' }
];
export const sources = [
  { id:'projects', name:'Project excerpts', detail:'Selected work and decision records', icon:'folder' },
  { id:'portfolio', name:'Portfolio artifacts', detail:'Designs, explanations, and prototypes', icon:'box' },
  { id:'practice', name:'Practice check-ins', detail:'Task-specific demonstrations of learning', icon:'check' }
];
export const goals = [
  { id:'product', name:'Build meaningful products', weights:{systems:1,research:1,story:.7,prototype:1,facilitation:.5,creative:.8} },
  { id:'clarity', name:'Communicate with clarity', weights:{systems:.6,research:.8,story:1,prototype:.3,facilitation:1,creative:.2} },
  { id:'create', name:'Bring more ideas to life', weights:{systems:.5,research:.4,story:.8,prototype:1,facilitation:.3,creative:1} }
];
export const perspectives = [
  { id:'investigator', title:'The careful investigator', subtitle:'Make the uncertainty inspectable.', color:'blue', shape:'rings', skill:'research', tags:['Research judgment','Source triangulation'], author:'Open Field', practices:['Use three genuinely independent sources, not three repetitions.','Write the strongest competing explanation.','State which observation would change your decision.'], tastes:['Traceable claims','Explicit uncertainty'], tension:'Shared practice is not proof of better judgment. Demonstrate the transfer.' },
  { id:'builder', title:'The systems builder', subtitle:'See the whole. Change the right part.', color:'mint', shape:'rings', skill:'systems', tags:['Systems thinking','Rapid prototyping'], author:'Fieldwork Studio', practices:['Draw the dependencies before the solution.','Ask what would disprove your favorite idea.','Test the smallest reversible change.'], tastes:['Quiet interfaces','Visible structure'], tension:'This lens favors simplicity. Keep the complexity that your actual problem requires.' },
  { id:'storyteller', title:'The clear storyteller', subtitle:'Find the thread people can follow.', color:'peach', shape:'stairs', skill:'story', tags:['Clear storytelling','Research judgment'], author:'Common Thread', practices:['Start with the listener’s question.','Make one idea concrete before adding another.','Keep the uncertainty in the story.'], tastes:['Everyday language','Concrete examples'], tension:'Clarity is not certainty. Do not remove a caveat just to make a better story.' },
  { id:'facilitator', title:'The generous collaborator', subtitle:'Make more room for better thinking.', color:'lilac', shape:'petals', skill:'facilitation', tags:['Facilitation','Systems thinking'], author:'Room for More', practices:['Invite a counterexample before agreement.','Make a quiet contribution channel available.','End with a shared action and an owner.'], tastes:['Open questions','Participatory formats'], tension:'Participation is not a personality test. Never infer engagement from a face, voice, or silence.' }
];
export const cohorts = referenceCohorts;
export const dimensions = [
  {id:'technical', name:'Technical capability', skills:['systems','creative'], weight:2/6},
  {id:'creative', name:'Creative production', skills:['prototype'], weight:1/6},
  {id:'research', name:'Research judgment', skills:['research'], weight:1/6},
  {id:'communication', name:'Communication', skills:['story'], weight:1/6},
  {id:'collaboration', name:'Facilitation & collaboration', skills:['facilitation'], weight:1/6}
];
export const skillById = id => skills.find(s => s.id === id);
export const personById = id => participants.find(p => p.id === id);
const modes = ['independent','assisted'];
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const round = x => Math.round(x * 10000) / 10000;
const mean = values => values.reduce((a,b)=>a+b,0)/values.length;
const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;
const recent = (date,asOf) => validDate(date) && validDate(asOf) && Date.parse(date)<=Date.parse(asOf) && Date.parse(asOf)-Date.parse(date)<=RECENCY_DAYS*86400000;
const bounded = (s,max=120) => typeof s === 'string' && s.length>0 && s.length<=max;
const weightFor = id => {const d=dimensions.find(d=>d.skills.includes(id)); return d.weight/d.skills.length;};
function log(state,type,detail) {
  state.audit.unshift({type,detail,date:new Date().toISOString()});
  state.audit=state.audit.slice(0,100);
}

export function initialState() {
  const evidence=skills.flatMap((s,si)=>modes.flatMap(mode=>s.marks.map((mark,i)=>({
    id:`seed-${s.id}-${mode}-${i}`, demonstrationId:`seed-${s.id}-${mode}-${i}`, skill:s.id,
    source:s.source, mode, mark:mode==='assisted'?Math.min(4,mark+1):mark, rubric:RUBRIC,
    protocol:PROTOCOL, status:'accepted', title:[s.practice,`Explain the trade-off: ${s.name}`,`Transfer check: ${s.name}`][i],
    date:`2026-09-${String(12+si+i).padStart(2,'0')}`, synthetic:true,
    provenance:`fixture://becoming-v1/${s.id}/${mode}/${i}`, assessor:'Synthetic rubric assessor',
    rationale:s.criterion, reviewNote:'Accepted starting fixture.'
  }))));
  evidence.push({id:'candidate-story', demonstrationId:'candidate-story', skill:'story', source:'practice',
    mode:'independent',mark:3,rubric:RUBRIC,protocol:PROTOCOL,status:'pending',
    title:'A 90-second explanation of a hard idea',date:REFERENCE_DATE,synthetic:true,
    provenance:'fixture://candidate-story/1',assessor:'Synthetic rubric assessor',
    rationale:'The audience can restate the core idea and trade-off; unfamiliar transfer remains untested.',reviewNote:''});
  const state={version:VERSION,asOf:REFERENCE_DATE,goal:'product',mode:'independent',cohort:'global',
    benchmarkVisible:true,sources:{projects:true,portfolio:true,practice:true},evidence,adopted:[],projects:[],audit:[],history:[]};
  createProject(state,{skill:'research',title:'Close the source-triangulation gap'});
  state.projects[0].id='project-research';state.projects[0].steps[0]=true;state.audit=[];
  for(const date of ['2026-09-14','2026-09-17','2026-09-20',REFERENCE_DATE]) {
    state.history.push(makeSnapshot({...state,asOf:date},date===REFERENCE_DATE?'Starting profile':'Dated evidence became eligible',date));
  }
  return state;
}

/** Eligibility is independent of cohort and interface selection. Unknown is null. */
export function evidenceExclusion(state,e,asOf=state.asOf) {
  if(e.status!=='accepted') return e.status==='revoked'?'Evidence revoked':'Not accepted';
  if(!state.sources[e.source]) return 'Source disconnected';
  if(e.rubric!==RUBRIC || e.protocol!==PROTOCOL) return 'Incompatible assessment version';
  if(!recent(e.date,asOf)) return 'Outside the observation window';
  if(!Number.isInteger(e.mark)||e.mark<0||e.mark>4) return 'Invalid rubric mark';
  return null;
}
export function estimate(state, skill, mode=state.mode) {
  const seen=new Set();
  const eligible=state.evidence.filter(e=>e.skill===skill && e.mode===mode && !evidenceExclusion(state,e))
    .sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))
    .filter(e=>{if(seen.has(e.demonstrationId))return false;seen.add(e.demonstrationId);return true;}).slice(0,MAX_SAMPLES);
  return {n:eligible.length, score:eligible.length>=MIN_EVIDENCE?mean(eligible.map(e=>e.mark)):null,
    range:eligible.length?[Math.min(...eligible.map(e=>e.mark)),Math.max(...eligible.map(e=>e.mark))]:null,
    coverage:eligible.length>=MIN_EVIDENCE?100:0,evidence:eligible,
    uncertainty:'Observed mark range, not a calibrated confidence interval.'};
}
export function percentile(score, values) {
  if(!Number.isFinite(score)||!values.length||values.some(v=>!Number.isFinite(v)))return null;
  const below=values.filter(v=>round(v)<round(score)).length,equal=values.filter(v=>round(v)===round(score)).length;
  return Math.round(100*(below+.5*equal)/values.length);
}
export function participantEstimate(person,skill,mode,asOf=REFERENCE_DATE) {
  const e=person?.observations?.[mode]?.[skill];
  if(!person?.permission?.compare||!person?.permission?.profile||person.referenceVersion!==REFERENCE_VERSION||
    !e||e.mode!==mode||e.rubric!==RUBRIC||e.protocol!==PROTOCOL||!e.accepted||!recent(e.observedAt,asOf)||
    !Array.isArray(e.marks)||e.marks.length<MIN_EVIDENCE||e.marks.some(v=>!Number.isInteger(v)||v<0||v>4))return null;
  return mean(e.marks.slice(-MAX_SAMPLES));
}
export function cohortPeople(cohortId) { return participants.filter(p=>p.cohorts.includes(cohortId)&&p.permission.compare&&p.permission.profile); }
export function cohortValues(skill,mode,cohortId,asOf=REFERENCE_DATE) {
  return cohortPeople(cohortId).map(p=>participantEstimate(p,skill,mode,asOf)).filter(v=>v!==null);
}
export function comparison(state,skill) {
  const stat=estimate(state,skill),values=cohortValues(skill,state.mode,state.cohort,state.asOf);
  if(!state.benchmarkVisible)return {available:false,reason:'Comparisons are paused in Data & consent.',values};
  if(values.length<MIN_COHORT)return {available:false,reason:`Withheld: fewer than ${MIN_COHORT} comparable records.`,values};
  if(stat.score===null)return {available:false,reason:`Unknown: ${stat.n}/${MIN_EVIDENCE} required accepted demonstrations in this mode.`,values};
  return {available:true,percentile:percentile(stat.score,values),values,mean:mean(values),n:values.length,
    stronger:values.filter(v=>round(v)>round(stat.score)).length,
    percentileRange:stat.range.map(v=>percentile(v,values)),cohort:state.cohort,referenceVersion:REFERENCE_VERSION};
}

/** A fixed, decomposable index; missing capability weights are excluded, never zero-filled.
 * Peer indices use precisely the same observed basket and weights as this subject.
 */
export function becomingIndex(state) {
  const components=skills.map(s=>({skill:s.id,weight:weightFor(s.id),...estimate(state,s.id)}));
  const known=components.filter(s=>s.score!==null),knownWeight=known.reduce((n,s)=>n+s.weight,0);
  const basket=known.map(s=>s.skill),coverage=Math.round(knownWeight*100);
  const score=known.length?250*known.reduce((n,s)=>n+s.score*s.weight,0)/knownWeight:null;
  const range=known.length?[0,1].map(i=>250*known.reduce((n,s)=>n+s.range[i]*s.weight,0)/knownWeight):null;
  const peers=cohortPeople(state.cohort).flatMap(person=>{
    const values=known.map(s=>participantEstimate(person,s.skill,state.mode,state.asOf));
    return !known.length||values.includes(null)?[]:[{person,score:250*values.reduce((n,v,i)=>n+v*known[i].weight,0)/knownWeight}];
  });
  const available=state.benchmarkVisible && score!==null && peers.length>=MIN_COHORT;
  const values=peers.map(p=>p.score);
  return {score,range,coverage,basket,components,partial:coverage<100,available,n:peers.length,
    percentile:available?percentile(score,values):null,rank:available?1+values.filter(v=>round(v)>round(score)).length:null,
    reason:!state.benchmarkVisible?'Comparisons are paused.':score===null?'No capability has sufficient accepted evidence.':peers.length<MIN_COHORT?'Fewer than 30 compatible reference people.':null,
    referenceVersion:REFERENCE_VERSION,version:INDEX_VERSION,asOf:state.asOf,mode:state.mode,cohort:state.cohort,
    uncertainty:'Weighted observed-mark envelope; descriptive, not a confidence interval.'};
}
export function dimensionStandings(state) {
  return dimensions.map(d=>{
    const stats=d.skills.map(id=>estimate(state,id)),known=stats.filter(x=>x.score!==null);
    const score=known.length?mean(known.map(x=>x.score)):null,basket=d.skills.filter((id,i)=>stats[i].score!==null);
    const values=cohortPeople(state.cohort).flatMap(p=>{const a=basket.map(id=>participantEstimate(p,id,state.mode,state.asOf));return a.length&&!a.includes(null)?[mean(a)]:[];});
    return {...d,score,coverage:100*known.length/stats.length,basket,
      percentile:state.benchmarkVisible&&score!==null&&values.length>=MIN_COHORT?percentile(score,values):null,
      range:known.length?[0,1].map(i=>mean(known.map(x=>x.range[i]))):null,n:values.length};
  });
}
export function comparePeople(state,personOrId) {
  const person=typeof personOrId==='string'?personById(personOrId):personOrId;
  if(!state.benchmarkVisible)return {available:false,reason:'Comparisons are paused.'};
  if(!person || !person.cohorts?.includes(state.cohort) || !person.permission?.compare || !person.permission?.profile)
    return {available:false,reason:'This profile is not authorized in the selected cohort.'};
  const rows=skills.map(s=>{const own=estimate(state,s.id),theirs=participantEstimate(person,s.id,state.mode,state.asOf);return {skill:s.id,yours:own.score,theirs,gap:own.score!==null&&theirs!==null?theirs-own.score:null,n:own.n};});
  if(!rows.some(r=>r.yours!==null&&r.theirs!==null))return {available:false,reason:'No compatible observed capabilities in this assistance condition.'};
  return {available:true,person,rows,gaps:rows.filter(r=>r.gap>0).sort((a,b)=>b.gap-a.gap)};
}
export function justAhead(state,skill) {
  const own=estimate(state,skill);if(own.score===null||!state.benchmarkVisible)return null;
  const list=cohortPeople(state.cohort).map(person=>({person,score:participantEstimate(person,skill,state.mode,state.asOf)}))
    .filter(p=>p.score!==null&&round(p.score)>round(own.score)).sort((a,b)=>a.score-b.score||a.person.id.localeCompare(b.person.id));
  const next=list[0];return next?{...next,skill,current:own.score,gap:next.score-own.score}:null;
}
export function opportunities(state) {
  const goal=goals.find(g=>g.id===state.goal);
  return skills.map(s=>{const score=estimate(state,s.id).score;return {...s,score,priority:goal.weights[s.id]*(score===null?.75:Math.max(0,s.target-score)),reason:score===null?'Establish a baseline with accepted demonstrations.':'Close a measured gap with a new demonstration.'};}).sort((a,b)=>b.priority-a.priority);
}
export function projectTarget(state,skill,personId=null) {
  if(!skillById(skill))throw new Error('Unknown capability.');
  if(personId&&!personById(personId))throw new Error('The requested comparator does not exist.');
  const current=estimate(state,skill),candidate=personId?{person:personById(personId)}:justAhead(state,skill);
  let referenceScore=null,person=null;
  if(candidate?.person) {
    const result=comparePeople(state,candidate.person);
    if(!result.available)throw new Error(result.reason);
    referenceScore=participantEstimate(candidate.person,skill,state.mode,state.asOf);person=candidate.person;
    if(referenceScore===null||current.score===null||round(referenceScore)<=round(current.score))throw new Error('Choose a compatible person who is demonstrably ahead in this capability.');
  }
  const context=comparison(state,skill);
  const threshold=referenceScore===null?(current.score===null?null:Math.min(4,Math.max(3,current.score+1/12))):Math.min(4,referenceScore+1/12);
  return {type:person?'person':current.score===null?'baseline':'threshold',personId:person?.id||null,
    personName:person?.displayName||null,referenceScore,targetScore:threshold,
    initialScore:current.score,initialPercentile:comparison(state,skill).percentile??null,
    targetPercentile:threshold===null||!context.available?null:percentile(threshold,context.values),
    relation:referenceScore===4?'match-ceiling':'surpass-threshold',
    cohort:state.cohort,referenceVersion:REFERENCE_VERSION,asOf:state.asOf,mode:state.mode,
    rubric:RUBRIC,protocol:PROTOCOL,skill,evidenceIds:current.evidence.map(e=>e.id),
    criterion:skillById(skill).criterion,
    success:threshold===null?'At least 3 accepted, distinct demonstrations under the frozen assistance condition.':`Accepted capability mean at or above ${round(threshold*25)} / 100, against the frozen target.${referenceScore===4?' This matches the rubric ceiling; no higher score is claimed.':''}`,
    rankNotice:'Rank implications are illustrative, not guaranteed. The reference population, evidence window and other people can change.'};
}
export function createProject(state,{skill,title,minutes=30,origin=null,personId=null}) {
  if(!skillById(skill)||!bounded(title)||!title.trim()||![15,30,60].includes(Number(minutes)))throw new Error('Choose a capability, a title of 1–120 characters, and a 15, 30, or 60 minute session.');
  if(origin!==null&&(!perspectives.some(p=>p.id===origin?.bundle)||origin.version!=='1.0'||!Array.isArray(origin.practices)||!origin.practices.length||origin.practices.some(i=>!Number.isInteger(i)||i<0||i>2)))throw new Error('Invalid shared-practice provenance.');
  if(state.projects.length>=99)throw new Error('The demo supports up to 99 projects. Export your briefs, then reset to start again.');
  const target=projectTarget(state,skill,personId);
  const p={id:uid('project'),skill,title:title.trim(),minutes:Number(minutes),steps:[false,false,false],status:'active',reflection:'',origin,target,reviewOutcome:''};
  state.projects.unshift(p);log(state,'project.created',p.title);return p;
}
export function adopt(state,id,indices,personId=null) {
  const bundle=perspectives.find(p=>p.id===id);
  if(!bundle||!Array.isArray(indices)||!indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>2))throw new Error('Choose at least one practice to try.');
  if(state.adopted.some(a=>a.id===id))throw new Error('This Perspective is already in your practice library.');
  if(personId&&(!personById(personId)?.permission?.practices||!personById(personId)?.sharedBundles.includes(id)))throw new Error('This person has not shared these practices.');
  const p=createProject(state,{skill:bundle.skill,title:`Surpass through practice: ${bundle.title}`,personId,
    origin:{bundle:id,version:'1.0',practices:[...new Set(indices)]}});
  state.adopted.push({id,version:'1.0',practices:[...new Set(indices)]});log(state,'perspective.adopted',bundle.title);return p;
}
export function replayAssessment(state,projectId,mode) {
  const p=state.projects.find(p=>p.id===projectId);
  if(!p||!p.steps.every(Boolean)||p.status!=='active')throw new Error('Finish the three demonstration steps before replaying the fixture.');
  if(!modes.includes(mode)||mode!==p.target.mode)throw new Error('The project assistance condition is frozen. Switch back to its mode.');
  if(!state.sources.practice)throw new Error('Practice check-ins are disconnected. Restore the demo source before adding evidence.');
  if(state.evidence.length>=999)throw new Error('The local evidence limit has been reached. Export a summary and reset the demo.');
  const id=uid('evidence');
  const e={id,demonstrationId:id,skill:p.skill,source:'practice',mode,mark:4,rubric:RUBRIC,protocol:PROTOCOL,status:'pending',
    title:p.title,date:state.asOf,synthetic:true,project:p.id,provenance:`fixture://surpass-transfer/${id}`,
    assessor:'Synthetic rubric assessor',rationale:`Prewritten transfer demonstration: ${p.target.criterion} The fictional participant repeats the method on an unseen constraint. This fixed 4/4 is not an assessment of your notes.`,reviewNote:''};
  state.evidence.unshift(e);p.status='review';log(state,'evidence.proposed',p.title);return e;
}
function updateProjects(state) {
  for(const p of state.projects) {
    if(state.evidence.some(e=>e.project===p.id&&e.status==='pending')){p.status='review';continue;}
    const accepted=state.evidence.some(e=>e.project===p.id&&!evidenceExclusion(state,e));
    const stat=estimate(state,p.skill,p.target.mode);
    p.status=accepted&&stat.score!==null&&(p.target.targetScore===null||stat.score>=p.target.targetScore)?'complete':'active';
  }
}
export function reviewEvidence(state,id,decision,note='') {
  const e=state.evidence.find(e=>e.id===id);
  if(!e||e.status!=='pending'||!['accepted','rejected'].includes(decision))throw new Error('Only a pending item can be reviewed once.');
  if(typeof note!=='string'||note.length>1000)throw new Error('Keep review notes under 1,000 characters.');
  if(decision==='accepted') {
    const reason=evidenceExclusion(state,{...e,status:'accepted'});if(reason)throw new Error(`Cannot accept: ${reason}.`);
  }
  e.status=decision;e.reviewNote=note;
  updateProjects(state);log(state,`evidence.${decision}`,e.title);
  if(decision==='accepted')recordSnapshot(state,`Accepted: ${e.title}`);
}
export function revokeEvidence(state,id) {
  const e=state.evidence.find(e=>e.id===id);
  if(!e||e.status!=='accepted')throw new Error('Only accepted evidence can be revoked.');
  e.status='revoked';updateProjects(state);log(state,'evidence.revoked',e.title);recordSnapshot(state,`Revoked: ${e.title}`);
}
export function setSource(state,id,enabled) {
  if(!sources.some(s=>s.id===id)||typeof enabled!=='boolean')throw new Error('Unknown source.');
  if(state.sources[id]===enabled)return;
  state.sources[id]=enabled;updateProjects(state);log(state,enabled?'source.reconnected':'source.revoked',sources.find(s=>s.id===id).name);
  recordSnapshot(state,`${enabled?'Restored':'Disconnected'}: ${sources.find(s=>s.id===id).name}`);
}
function makeSnapshot(state,label,date=state.asOf) {
  const snapshot={id:uid('snapshot'),date,label,referenceVersion:REFERENCE_VERSION,modes:{}};
  for(const mode of modes) {
    const view={...state,mode},index=becomingIndex(view);
    snapshot.modes[mode]={score:index.score,coverage:index.coverage,basket:index.basket,
      capabilities:Object.fromEntries(skills.map(s=>[s.id,{score:estimate(view,s.id).score,n:estimate(view,s.id).n}])),
      percentiles:Object.fromEntries(cohorts.map(c=>[c.id,becomingIndex({...view,cohort:c.id,benchmarkVisible:true}).percentile]))};
  }
  return snapshot;
}
function recordSnapshot(state,label) {state.history.push(makeSnapshot(state,label));state.history=state.history.slice(-100);}
export function movement(state,days=30) {
  const now=becomingIndex(state),cutoff=Date.parse(state.asOf)-days*86400000;
  const compatible=state.history.filter(s=>Date.parse(s.date)>=cutoff&&Date.parse(s.date)<=Date.parse(state.asOf)&&s.referenceVersion===REFERENCE_VERSION&&s.modes[state.mode].basket.join()===now.basket.join());
  const baseline=compatible.find(s=>s.modes[state.mode].score!==null);
  const percentileBaseline=compatible.find(s=>Number.isFinite(s.modes[state.mode].percentiles[state.cohort]));
  const old=baseline?.modes[state.mode],priorRank=percentileBaseline?.modes[state.mode].percentiles[state.cohort];
  return {baseline:baseline||null,percentileBaseline:percentileBaseline||null,
    points:old&&now.score!==null?now.score-old.score:null,
    percentilePoints:state.benchmarkVisible&&Number.isFinite(priorRank)&&now.percentile!==null?now.percentile-priorRank:null,
    note:`Only matching baskets, conditions and references. Index baseline: ${baseline?.date||'unavailable'}; percentile baseline: ${state.benchmarkVisible?percentileBaseline?.date||'unavailable':'paused'}.`};
}

export function disclosure(state) {
  return {schema:'becoming-disclosure/2',synthetic:true,purpose:'voluntary-personal-comparison',rubric:RUBRIC,
    asOf:state.asOf,referenceVersion:REFERENCE_VERSION,
    indices:modes.map(mode=>{const i=becomingIndex({...state,mode});return {mode,score:i.score,coverage:i.coverage,basket:i.basket,percentile:i.percentile,cohort:i.cohort};}),
    claims:skills.flatMap(s=>modes.map(mode=>({skill:s.id,mode,n:estimate(state,s.id,mode).n,score:estimate(state,s.id,mode).score}))),
    notice:'Synthetic arithmetic reference only. No raw evidence, project notes, private audit trail or shared practices are exported.'};
}
export function projectBrief(p) {
  const s=skillById(p.skill),t=p.target,bundle=perspectives.find(x=>x.id===p.origin?.bundle);
  return `# Surpass Project: ${p.title}\n\nCapability: ${s.name}\nSession: ${p.minutes} minutes\n\n## Comparison target\n${t.personName||'Capability threshold'} (synthetic)\nReference: ${t.referenceVersion}\nCohort: ${t.cohort}\nAs of: ${t.asOf}\nCurrent mean: ${t.initialScore===null?'Unknown':round(t.initialScore*25)+'/100'}\nTarget mean: ${t.targetScore===null?'Establish a baseline':round(t.targetScore*25)+'/100'}\n\n## Frozen evidence contract\nRubric: ${t.rubric}\nProtocol: ${t.protocol}\nAllowed assistance: ${t.mode}\nCurrent evidence: ${t.evidenceIds.join(', ')||'None'}\n\n## Success criterion\n${t.criterion}\n${t.success}\n\n## Demonstration\n1. Frame the decision, audience and constraints.\n2. Produce an inspectable artifact with assistance disclosed.\n3. Repeat the method on an unfamiliar constraint and explain the trade-off.\n\n## Evidence review\nHuman review must accept eligible evidence before any estimate changes. A completed checklist and adopted practices never change rank.\n${t.rankNotice}\n\n${bundle?`## Shared practices\n${bundle.title} v1.0, fictional creator.\n${p.origin.practices.map(i=>'- '+bundle.practices[i]).join('\n')}\n\n`:''}## Reflection\n${p.reflection||'(Not yet recorded.)'}\n\n---\nManual, portable brief. This file does not create or connect an account or a provider Project.\n`;
}
export function policyGate(purpose) {return ['personal-learning','personal-comparison','consented-practice','aggregate-research'].includes(purpose);}

/** Local persistence validation, not authentication or proof against tampering. */
export function isState(s) {
  try {
    const unique=items=>new Set(items.map(x=>x.id)).size===items.length;
    const validScore=v=>v===null||(Number.isFinite(v)&&v>=0&&v<=4);
    const validPercentile=v=>v===null||(Number.isFinite(v)&&v>=0&&v<=100);
    const validOrigin=o=>o===null||(perspectives.some(p=>p.id===o?.bundle)&&o.version==='1.0'&&Array.isArray(o.practices)&&o.practices.length>0&&o.practices.every(i=>Number.isInteger(i)&&i>=0&&i<3));
    return !!s&&s.version===VERSION&&validDate(s.asOf)&&goals.some(g=>g.id===s.goal)&&modes.includes(s.mode)&&cohorts.some(c=>c.id===s.cohort)
      &&typeof s.benchmarkVisible==='boolean'&&sources.every(src=>typeof s.sources?.[src.id]==='boolean')
      &&Array.isArray(s.evidence)&&s.evidence.length<1000&&unique(s.evidence)&&s.evidence.every(e=>
        bounded(e.id)&&bounded(e.demonstrationId)&&skillById(e.skill)&&sources.some(src=>src.id===e.source)&&modes.includes(e.mode)
        &&Number.isInteger(e.mark)&&e.mark>=0&&e.mark<=4&&e.rubric===RUBRIC&&e.protocol===PROTOCOL&&e.synthetic===true
        &&['pending','accepted','rejected','revoked'].includes(e.status)&&bounded(e.title,300)&&validDate(e.date)
        &&bounded(e.provenance,500)&&bounded(e.assessor)&&typeof e.rationale==='string'&&e.rationale.length<=2000
        &&typeof e.reviewNote==='string'&&e.reviewNote.length<=1000&&(e.project===undefined||bounded(e.project)))
      &&Array.isArray(s.projects)&&s.projects.length<100&&unique(s.projects)&&s.projects.every(p=>{
        const t=p.target;return skillById(p.skill)&&bounded(p.id)&&bounded(p.title)&&[15,30,60].includes(p.minutes)
          &&['active','review','complete'].includes(p.status)&&Array.isArray(p.steps)&&p.steps.length===3&&p.steps.every(v=>typeof v==='boolean')
          &&typeof p.reflection==='string'&&p.reflection.length<=4000&&validOrigin(p.origin)
          &&t&&t.skill===p.skill&&modes.includes(t.mode)&&t.rubric===RUBRIC&&t.protocol===PROTOCOL&&cohorts.some(c=>c.id===t.cohort)
          &&t.referenceVersion===REFERENCE_VERSION&&validDate(t.asOf)&&Array.isArray(t.evidenceIds)&&t.evidenceIds.every(id=>bounded(id))
          &&['person','baseline','threshold'].includes(t.type)&&(t.personId===null?t.type!=='person':t.type==='person'&&!!personById(t.personId)&&t.personName===personById(t.personId).displayName)
          &&validScore(t.initialScore)&&validScore(t.referenceScore)&&validPercentile(t.initialPercentile)&&validPercentile(t.targetPercentile)
          &&bounded(t.rankNotice,1000)&&['match-ceiling','surpass-threshold'].includes(t.relation)
          &&(t.targetScore===null||Number.isFinite(t.targetScore)&&t.targetScore>=0&&t.targetScore<=4)&&bounded(t.criterion,1000)&&bounded(t.success,1000);
      })
      &&Array.isArray(s.adopted)&&s.adopted.length<=perspectives.length&&unique(s.adopted)&&s.adopted.every(a=>validOrigin({bundle:a.id,version:a.version,practices:a.practices}))
      &&Array.isArray(s.audit)&&s.audit.length<=100&&s.audit.every(a=>bounded(a.type)&&bounded(a.detail,500)&&bounded(a.date))
      &&Array.isArray(s.history)&&s.history.length<=100&&unique(s.history)&&s.history.every(h=>bounded(h.id)&&validDate(h.date)&&bounded(h.label,500)&&h.referenceVersion===REFERENCE_VERSION&&modes.every(m=>{
        const x=h.modes[m];return x&&(x.score===null||Number.isFinite(x.score)&&x.score>=0&&x.score<=1000)&&Number.isFinite(x.coverage)&&x.coverage>=0&&x.coverage<=100&&Array.isArray(x.basket)&&new Set(x.basket).size===x.basket.length&&x.basket.every(id=>!!skillById(id))&&skills.every(k=>x.capabilities[k.id]&&validScore(x.capabilities[k.id].score)&&Number.isInteger(x.capabilities[k.id].n)&&x.capabilities[k.id].n>=0&&x.capabilities[k.id].n<=MAX_SAMPLES)&&cohorts.every(c=>x.percentiles[c.id]===null||Number.isFinite(x.percentiles[c.id])&&x.percentiles[c.id]>=0&&x.percentiles[c.id]<=100);
      }));
  } catch {return false;}
}
