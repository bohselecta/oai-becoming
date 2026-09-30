import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JOURNEY_KEY, JOURNEY_VERSION, JOURNEY_STAGES, SKILL_OPTIONS, freshJourney, isJourney, saveAnswer, correctJourney, startNextStep, removeAttempt, readJourney, writeJourney, exportJourney, parseJourneyBackup, deleteJourney} from '../src/journey.js';

const AT = '2026-09-30T12:00:00.000Z';
const LATER = '2026-10-01T12:00:00.000Z';
const answer = (record, stage, value) => saveAnswer(record, stage, value, AT);
const correction = (record, patch) => correctJourney(record, patch, LATER);
const clone = value => JSON.parse(JSON.stringify(value));

function readyJourney() {
  return [
    ['interest', 'Making small events happen'],
    ['story', 'I organised a neighbourhood dinner. I planned the tasks, asked friends for help, and changed the venue when it rained.'],
    ['skills', ['planning', 'coordination', 'adaptation']],
    ['direction', 'Try organising a public workshop'],
    ['reward', 'Helping people meet one another'],
    ['constraints', 'One free evening each week'],
    ['action', 'Ask the library about a small pilot workshop']
  ].reduce((record, [stage, value]) => answer(record, stage, value), freshJourney());
}

function reviewedJourney(evidenceStatus = 'supports') {
  return answer(readyJourney(), 'reflection', {outcome:'The library could host a pilot, but I still need to test whether people want it.', evidenceStatus});
}

function storage(entries = {}) {
  const values = new Map(Object.entries(entries));
  const operations = [];
  return {
    values, operations,
    getItem(key) { operations.push(['get', key]); return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { operations.push(['set', key]); values.set(key, value); },
    removeItem(key) { operations.push(['remove', key]); values.delete(key); }
  };
}

function freeze(value) {
  Object.freeze(value);
  Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child); });
  return value;
}

test('discovery has its own version and key, separate from the synthetic fixture', () => {
  assert.equal(JOURNEY_VERSION, 1);
  assert.equal(JOURNEY_KEY, 'becoming-journey-v1');
  assert.notEqual(JOURNEY_KEY, 'becoming-comparative-v2');
  assert.deepEqual(JOURNEY_STAGES, ['interest','story','skills','direction','reward','constraints','action','ready','reflection']);
  assert.deepEqual(SKILL_OPTIONS.map(option => option.id), ['planning','coordination','persistence','adaptation']);
  assert.ok(SKILL_OPTIONS.every(option => option.label && option.description.startsWith('I ')));
});

test('fresh records contain no claimed skill, chosen direction, outcome, or fabricated answers', () => {
  assert.deepEqual(freshJourney(), {version:1, revision:0, stage:'interest', interest:'', story:'', skills:[], direction:'', reward:'', constraints:'', nextStep:'', outcome:'', evidenceStatus:'unreviewed', attempts:[], decisions:[], updatedAt:null});
  assert.ok(isJourney(freshJourney()));
  const a = freshJourney(), b = freshJourney();
  a.skills.push('planning');
  assert.deepEqual(b.skills, []);
});

test('an empty store starts fresh without writing anything', () => {
  const local = storage();
  assert.deepEqual(readJourney(local), {record:freshJourney(), status:'new'});
  assert.deepEqual(local.operations, [['get', JOURNEY_KEY]]);
});

test('complete one-question path advances to a single next action', () => {
  const record = readyJourney();
  assert.ok(isJourney(record));
  assert.equal(record.stage, 'ready');
  assert.equal(record.revision, 7);
  assert.equal(record.nextStep, 'Ask the library about a small pilot workshop');
  assert.equal(record.outcome, '');
  assert.equal(record.evidenceStatus, 'unreviewed');
  assert.deepEqual(record.decisions.map(event => event.fields), [['interest'], ['story','skills'], ['skills'], ['direction'], ['reward'], ['constraints'], ['nextStep']]);
});

test('saved answers are detached and do not mutate any input', () => {
  const record = freeze(freshJourney());
  const next = answer(record, 'interest', '  Events  ');
  assert.equal(next.interest, 'Events');
  assert.equal(record.interest, '');
  assert.equal(record.revision, 0);
  const story = freeze(answer(next, 'story', 'I planned the steps.'));
  const choices = freeze(['planning']);
  const skills = answer(story, 'skills', choices);
  skills.skills.push('persistence');
  assert.deepEqual(choices, ['planning']);
  assert.deepEqual(story.skills, []);
  skills.decisions[0].fields.push('story');
  assert.deepEqual(story.decisions[0].fields, ['interest']);
});

test('empty confirmed-actions selection and constraints are permitted', () => {
  let record = answer(freshJourney(), 'interest', 'A new thing');
  record = answer(record, 'story', 'I tried a new thing.');
  record = answer(record, 'skills', []);
  assert.equal(record.stage, 'direction');
  record = answer(record, 'direction', 'Explore another version');
  record = answer(record, 'reward', 'Learning what I enjoy');
  record = answer(record, 'constraints', '   ');
  assert.equal(record.constraints, '');
  assert.equal(record.stage, 'action');
});

test('required answers reject empty, whitespace, nontext, and oversized values', () => {
  const record = readyJourney();
  for (const [stage, max] of [['interest',300], ['story',3000], ['direction',600], ['reward',600], ['action',1500]]) {
    for (const value of ['', ' \n ', null, {}, 3, 'x'.repeat(max + 1)]) assert.throws(() => answer(record, stage, value));
    assert.doesNotThrow(() => answer(record, stage, 'x'.repeat(max)));
  }
  assert.throws(() => answer(record, 'constraints', 'x'.repeat(1001)));
  assert.throws(() => answer(record, 'constraints', null));
  assert.doesNotThrow(() => answer(record, 'constraints', 'x'.repeat(1000)));
});

test('stages cannot skip missing required context or save a fake ready answer', () => {
  for (const stage of ['story','skills','direction','reward','constraints','action','ready','reflection','unknown']) {
    assert.throws(() => answer(freshJourney(), stage, 'A shortcut'));
  }
  assert.equal(isJourney({...freshJourney(), stage:'ready'}), false);
  assert.equal(isJourney({...freshJourney(), stage:'story'}), false);
});

test('earlier answers can be revised without silently throwing away other user text', () => {
  const record = readyJourney();
  const next = answer(record, 'interest', 'Neighbourhood projects');
  assert.equal(next.stage, 'story');
  assert.equal(next.nextStep, record.nextStep);
  assert.equal(next.story, record.story);
});

test('only distinct known confirmed actions are accepted', () => {
  const record = readyJourney();
  for (const value of [['planning','planning'], ['research'], ['planning', {}], 'planning', [null], Array(2)]) {
    assert.throws(() => answer(record, 'skills', value));
    assert.equal(isJourney({...record, skills:value}), false);
  }
});

test('supports, contradicts, and uncertain all retain the actual tried action without a score', () => {
  for (const state of ['supports', 'contradicts', 'uncertain']) {
    const record = reviewedJourney(state);
    assert.equal(record.stage, 'ready');
    assert.equal(record.evidenceStatus, state);
    assert.equal(record.nextStep, readyJourney().nextStep);
    assert.deepEqual(record.skills, readyJourney().skills);
    assert.ok(isJourney(record));
    for (const field of ['score','rank','percentile','proficiency','complete','completedSkills']) assert.equal(Object.hasOwn(record, field), false);
  }
});

test('reflection requires an outcome and an explicit, recognized uncertainty decision', () => {
  const record = readyJourney();
  for (const value of [null, {}, 'done', {outcome:'',evidenceStatus:'supports'}, {outcome:'  ',evidenceStatus:'uncertain'}, {outcome:'x'.repeat(1501),evidenceStatus:'supports'}, {outcome:'Tried it',evidenceStatus:'unreviewed'}, {outcome:'Tried it',evidenceStatus:'complete'}, {outcome:'Tried it',evidenceStatus:'supports',score:100}]) {
    assert.throws(() => answer(record, 'reflection', value));
  }
  assert.throws(() => answer(freshJourney(), 'reflection', {outcome:'Tried it',evidenceStatus:'supports'}));
});

test('corrections are atomic and preserve frozen inputs on validation failure', () => {
  const record = freeze(reviewedJourney());
  const before = JSON.stringify(record);
  for (const patch of [{story:'A changed story',skills:['unknown']}, {stage:'ready'}, {score:100}, {version:2}, {reward:'x'.repeat(601)}, {evidenceStatus:'complete'}, {outcome:''}]) assert.throws(() => correction(record, patch));
  assert.equal(JSON.stringify(record), before);
});

test('changing a story, confirmed action, direction, or next step clears stale conclusions', () => {
  for (const patch of [{story:'A different example'}, {skills:[]}, {direction:'Try something else'}, {nextStep:'Ask someone else'}]) {
    const record = freeze(reviewedJourney('contradicts'));
    const next = correction(record, patch);
    assert.equal(next.outcome, '');
    assert.equal(next.evidenceStatus, 'unreviewed');
    assert.equal(next.revision, record.revision + 1);
    assert.ok(next.decisions.at(-1).fields.includes('outcome'));
    assert.ok(next.decisions.at(-1).fields.includes('evidenceStatus'));
    assert.equal(record.evidenceStatus, 'contradicts');
  }
});

test('ordinary answer changes invalidate dependent outcomes just like corrections', () => {
  for (const [stage, value] of [['story','Another actual story'], ['skills',[]], ['direction','A different direction'], ['action','A different experiment']]) {
    const next = answer(reviewedJourney(), stage, value);
    assert.equal(next.outcome, '');
    assert.equal(next.evidenceStatus, 'unreviewed');
  }
});

test('correcting a story removes old confirmed actions and reopens explicit confirmation', () => {
  const record = freeze(reviewedJourney());
  for (const patch of [
    {story:'I only watched.'},
    {story:'I only watched.', skills:[...record.skills]},
    {story:'I only watched.', skills:['persistence']}
  ]) {
    const next = correction(record, patch);
    assert.equal(next.story, 'I only watched.');
    assert.deepEqual(next.skills, []);
    assert.equal(next.stage, 'skills');
    assert.equal(next.outcome, '');
    assert.equal(next.evidenceStatus, 'unreviewed');
    assert.ok(next.decisions.at(-1).fields.includes('skills'));
    const confirmed = answer(next, 'skills', ['adaptation']);
    assert.deepEqual(confirmed.skills, ['adaptation']);
    assert.equal(confirmed.stage, 'direction');
  }
  assert.deepEqual(record.skills, ['planning', 'coordination', 'adaptation']);
});

test('saving a changed story clears actions until a separate skills answer', () => {
  const record = freeze(reviewedJourney());
  const next = answer(record, 'story', 'I only watched.');
  assert.deepEqual(next.skills, []);
  assert.equal(next.stage, 'skills');
  assert.equal(next.outcome, '');
  assert.equal(next.evidenceStatus, 'unreviewed');
  assert.deepEqual(answer(next, 'skills', []).skills, []);
  assert.deepEqual(answer(next, 'skills', ['persistence']).skills, ['persistence']);
  assert.deepEqual(answer(record, 'story', record.story).skills, record.skills);
});

test('a reported outcome can be explicitly cleared without changing the tried action', () => {
  const record = freeze(reviewedJourney());
  const next = correction(record, {outcome:'', evidenceStatus:'unreviewed'});
  assert.equal(next.outcome, '');
  assert.equal(next.evidenceStatus, 'unreviewed');
  assert.equal(next.nextStep, record.nextStep);
  assert.deepEqual(next.skills, record.skills);
  assert.equal(next.stage, 'ready');
  assert.equal(next.revision, record.revision + 1);
  assert.ok(isJourney(next));
});

test('correcting reward or constraints does not rewrite the person’s reported result', () => {
  const record = reviewedJourney('uncertain');
  const next = correction(record, {reward:'Working alongside people', constraints:'Only weekends'});
  assert.equal(next.outcome, record.outcome);
  assert.equal(next.evidenceStatus, 'uncertain');
});

test('clearing a required answer reopens the relevant question and removes stale conclusions', () => {
  for (const [field, stage] of [['interest','interest'], ['story','story'], ['direction','direction'], ['reward','reward'], ['nextStep','action']]) {
    const next = correction(reviewedJourney(), {[field]:''});
    assert.equal(next.stage, stage);
    assert.equal(next[field], '');
    assert.equal(next.outcome, '');
    assert.equal(next.evidenceStatus, 'unreviewed');
    assert.ok(isJourney(next));
  }
});

test('an unchanged correction is a detached copy without a fabricated revision', () => {
  const record = reviewedJourney();
  const next = correction(record, {story:record.story, skills:[...record.skills]});
  assert.deepEqual(next, record);
  assert.notEqual(next, record);
  assert.notEqual(next.skills, record.skills);
  assert.notEqual(next.decisions[0], record.decisions[0]);
});

test('decision history is bounded metadata and never preserves replaced text', () => {
  let record = answer(freshJourney(), 'interest', 'PRIVATE ORIGINAL PHRASE');
  for (let i = 0; i < 65; i++) record = correction(record, {interest:`Replacement ${i}`});
  assert.equal(record.revision, 66);
  assert.equal(record.decisions.length, 50);
  assert.equal(record.decisions[0].revision, 17);
  assert.ok(record.decisions.every(event => Object.keys(event).join(',') === 'revision,at,kind,fields'));
  assert.ok(!exportJourney(record).includes('PRIVATE ORIGINAL PHRASE'));
  assert.ok(!exportJourney(record).includes('Replacement 63'));
  assert.ok(isJourney(record));
});

test('deterministic timestamps are supported and a backward device clock remains reloadable', () => {
  const record = saveAnswer(freshJourney(), 'interest', 'Events', LATER);
  const next = saveAnswer(record, 'story', 'I planned one', AT);
  assert.equal(next.updatedAt, LATER);
  assert.ok(isJourney(next));
  assert.deepEqual(saveAnswer(record, 'story', 'I planned one', AT), next);
  assert.throws(() => saveAnswer(record, 'story', 'I planned one', 'bad date'));
});

test('save, reload, correct, and reload retain only the latest user-authored record', () => {
  const local = storage();
  const original = reviewedJourney();
  assert.deepEqual(writeJourney(local, original), {ok:true});
  let loaded = readJourney(local);
  assert.equal(loaded.status, 'saved');
  assert.deepEqual(loaded.record, original);
  loaded.record = correction(loaded.record, {story:'The revised account'});
  assert.deepEqual(writeJourney(local, loaded.record), {ok:true});
  assert.deepEqual(readJourney(local).record, loaded.record);
  assert.equal(readJourney(local).record.evidenceStatus, 'unreviewed');
});

test('hostile text remains literal data through saving, corrections, and export/import', () => {
  const hostile = '<img src=x onerror="globalThis.pwned=true"> & </script><script>alert(1)</script>';
  const record = correction(readyJourney(), {story:hostile, direction:'${location.href}'});
  const local = storage();
  assert.equal(writeJourney(local, record).ok, true);
  assert.equal(readJourney(local).record.story, hostile);
  assert.equal(parseJourneyBackup(exportJourney(record)).story, hostile);
  assert.equal(globalThis.pwned, undefined);
});

test('corrupt, malformed, incompatible, and future-version storage is retained byte for byte', () => {
  const record = readyJourney();
  const raws = ['{not-json', 'null', '[]', '{}', JSON.stringify({...record,version:2}), JSON.stringify({...record,stage:'complete'}), JSON.stringify({...record,skills:['unknown']}), JSON.stringify({...record,revision:-1})];
  for (const raw of raws) {
    const local = storage({[JOURNEY_KEY]:raw});
    const loaded = readJourney(local);
    assert.equal(loaded.status, 'recovery');
    assert.equal(loaded.raw, raw);
    assert.deepEqual(loaded.record, freshJourney());
    assert.equal(local.values.get(JOURNEY_KEY), raw);
    assert.deepEqual(local.operations, [['get', JOURNEY_KEY]]);
  }
});

test('malformed nested state and extra retained text cannot pass the validator', () => {
  const base = reviewedJourney();
  const cases = [
    {...base,score:100}, {...base,updatedAt:'yesterday'}, {...base,revision:1.5}, {...base,revision:Number.MAX_SAFE_INTEGER + 1},
    {...base,outcome:'',evidenceStatus:'supports'}, {...base,evidenceStatus:'unreviewed'},
    {...base,story:'x'.repeat(3001)}, {...base,decisions:[]}, {...base,decisions:Array(8)},
    {...base,decisions:[...base.decisions.slice(0,-1), {...base.decisions.at(-1), oldText:'Deleted secret'}]},
    {...base,decisions:[...base.decisions.slice(0,-1), {...base.decisions.at(-1), fields:['story','story']}]},
    {...base,decisions:[...base.decisions.slice(0,-1), {...base.decisions.at(-1), fields:['score']}]},
    {...base,decisions:[...base.decisions.slice(0,-1), {...base.decisions.at(-1), fields:[]}]},
    {...base,decisions:[...base.decisions.slice(0,-1), {...base.decisions.at(-1), revision:200}]},
    {...base,decisions:[...base.decisions.slice(0,-1), {...base.decisions.at(-1), kind:'assessed'}]},
    {...base,decisions:[...base.decisions.slice(0,-1), {...base.decisions.at(-1), at:'2026-02-30T00:00:00.000Z'}]}
  ];
  for (const value of cases) {
    assert.equal(isJourney(value), false);
    assert.throws(() => parseJourneyBackup(JSON.stringify(value)));
  }
  assert.equal(isJourney({...freshJourney(),interest:'Unsaved claim'}), false);
  assert.equal(isJourney(Object.assign(Object.create({inherited:true}), base)), false);
  assert.equal(isJourney({...base,[Symbol('extra')]:true}), false);
  const computed = {...base};
  Object.defineProperty(computed, 'story', {get() { throw new Error('Do not execute'); }});
  assert.equal(isJourney(computed), false);
});

test('storage blocked on read, write, or removal returns actionable failure without crashing', () => {
  const blocked = {getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('SecurityError'); }};
  assert.equal(readJourney(blocked).status, 'unavailable');
  assert.equal(writeJourney(blocked, readyJourney()).ok, false);
  assert.equal(deleteJourney(blocked).ok, false);
  for (const local of [null, {}]) {
    assert.equal(readJourney(local).status, 'unavailable');
    assert.equal(writeJourney(local, freshJourney()).ok, false);
    assert.equal(deleteJourney(local).ok, false);
  }
});

test('a full store preserves the prior saved value and leaves the new in-memory answer available', () => {
  const original = readyJourney();
  const local = storage({[JOURNEY_KEY]:JSON.stringify(original)});
  local.setItem = () => { throw new Error('QuotaExceededError'); };
  const next = correction(original, {nextStep:'Try another small step'});
  const result = writeJourney(local, next);
  assert.equal(result.ok, false);
  assert.match(result.message, /export/i);
  assert.deepEqual(readJourney(local).record, original);
  assert.equal(next.nextStep, 'Try another small step');
});

test('invalid records never reach the storage writer', () => {
  const local = storage();
  assert.equal(writeJourney(local, {...freshJourney(),skills:['unknown']}).ok, false);
  assert.deepEqual(local.operations, []);
});

test('wrapped backups and bare records roundtrip with no upload or scoring claim', () => {
  const record = reviewedJourney('uncertain');
  const exported = exportJourney(record);
  const wrapper = JSON.parse(exported);
  assert.equal(wrapper.format, 'becoming-local-record/1');
  assert.match(wrapper.notice, /user’s own account/);
  assert.match(wrapper.notice, /not an assessed score/);
  assert.match(wrapper.notice, /does not upload or share/);
  assert.deepEqual(parseJourneyBackup(exported), record);
  assert.deepEqual(parseJourneyBackup(JSON.stringify(record)), record);
  const imported = parseJourneyBackup(exported);
  imported.skills.length = 0;
  assert.notEqual(imported.skills.length, record.skills.length);
});

test('malformed, oversized, and incompatible backups fail before replacing any record', () => {
  const wrapper = JSON.parse(exportJourney(readyJourney()));
  for (const input of ['', null, '{', 'null', '[]', 'x'.repeat(2000001), JSON.stringify({...wrapper,format:'becoming-local-record/2'}), JSON.stringify({...wrapper,notice:null}), JSON.stringify({...wrapper,record:{...wrapper.record,version:2}}), JSON.stringify({...wrapper,extra:'ignored?'}), JSON.stringify({format:wrapper.format,record:wrapper.record}), JSON.stringify({version:2,synthetic:true}), '{"__proto__":{"polluted":true}}']) {
    assert.throws(() => parseJourneyBackup(input));
  }
  assert.equal({}.polluted, undefined);
});

test('reading, writing, and deleting discovery never reads or changes the synthetic key', () => {
  const old = 'the existing synthetic demo state';
  const local = storage({'becoming-comparative-v2':old, 'another-app':'also preserved'});
  assert.equal(readJourney(local).status, 'new');
  assert.equal(writeJourney(local, readyJourney()).ok, true);
  assert.equal(deleteJourney(local).ok, true);
  assert.equal(local.values.get('becoming-comparative-v2'), old);
  assert.equal(local.values.get('another-app'), 'also preserved');
  assert.ok(local.operations.every(([, key]) => key === JOURNEY_KEY));
  assert.equal(readJourney(local).status, 'new');
});

test('failed deletion preserves the existing record and does not report a reset', () => {
  const original = JSON.stringify(readyJourney());
  const local = storage({[JOURNEY_KEY]:original});
  local.removeItem = () => { throw new Error('SecurityError'); };
  const result = deleteJourney(local);
  assert.equal(result.ok, false);
  assert.match(result.message, /not been reset/);
  assert.equal(local.values.get(JOURNEY_KEY), original);
});

test('journey logic is local and independent of synthetic measurements or remote calls', () => {
  const source = readFileSync(new URL('../src/journey.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\bimport\s/);
  assert.doesNotMatch(source, /\bfetch\s*\(|new\s+WebSocket|sendBeacon\s*\(|XMLHttpRequest/);
  assert.doesNotMatch(source, /becoming-comparative-v2|becomingIndex\s*\(|estimate\s*\(/);
});

test('exact earlier schema-one records acquire an empty attempt list without rewriting storage', () => {
  const current = reviewedJourney();
  const earlier = clone(current);
  delete earlier.attempts;
  const raw = JSON.stringify(earlier);
  const local = storage({[JOURNEY_KEY]:raw});
  const loaded = readJourney(local);
  assert.equal(loaded.status, 'saved');
  assert.deepEqual(loaded.record, current);
  assert.equal(local.values.get(JOURNEY_KEY), raw);
  assert.deepEqual(local.operations, [['get', JOURNEY_KEY]]);
  assert.deepEqual(parseJourneyBackup(raw), current);
  const wrapper = JSON.parse(exportJourney(current));
  wrapper.record = earlier;
  assert.deepEqual(parseJourneyBackup(JSON.stringify(wrapper)), current);
  assert.equal(readJourney(storage({[JOURNEY_KEY]:JSON.stringify({...earlier,version:2})})).status, 'recovery');
});

test('migration cannot discard snapshots from a record that already has attempt events', () => {
  const record = startNextStep(reviewedJourney(), 'Try another step', LATER);
  delete record.attempts;
  const raw = JSON.stringify(record);
  assert.equal(readJourney(storage({[JOURNEY_KEY]:raw})).status, 'recovery');
  assert.throws(() => parseJourneyBackup(raw));
});

test('starting the next action retains the entire completed attempt across reload and export', () => {
  for (const evidenceStatus of ['supports','contradicts','uncertain']) {
    const original = freeze(reviewedJourney(evidenceStatus));
    const next = startNextStep(original, 'Ask participants what they would want', LATER);
    assert.equal(next.stage, 'ready');
    assert.equal(next.nextStep, 'Ask participants what they would want');
    assert.equal(next.outcome, '');
    assert.equal(next.evidenceStatus, 'unreviewed');
    assert.equal(next.attempts.length, 1);
    const attempt = next.attempts[0];
    assert.equal(attempt.id, `attempt-${next.revision}`);
    assert.equal(attempt.at, LATER);
    for (const field of ['interest','story','skills','direction','reward','constraints','nextStep','outcome','evidenceStatus']) assert.deepEqual(attempt[field], original[field]);
    assert.equal(next.decisions.at(-1).kind, 'next-step');
    assert.ok(next.decisions.at(-1).fields.includes('attempts'));
    const local = storage();
    assert.equal(writeJourney(local, next).ok, true);
    assert.deepEqual(readJourney(local).record, next);
    assert.deepEqual(parseJourneyBackup(exportJourney(next)), next);
    assert.deepEqual(original.attempts, []);
  }
});

test('untried next steps can change without inventing a completed attempt', () => {
  const original = freeze(readyJourney());
  const next = startNextStep(original, '  A more useful first step  ', LATER);
  assert.equal(next.nextStep, 'A more useful first step');
  assert.deepEqual(next.attempts, []);
  assert.equal(next.evidenceStatus, 'unreviewed');
  for (const value of ['', ' ', null, 'x'.repeat(1501)]) assert.throws(() => startNextStep(original, value, LATER));
  assert.throws(() => startNextStep(freshJourney(), 'Skip everything', LATER));
});

test('archived context is detached and current corrections never rewrite earlier stories or results', () => {
  const original = reviewedJourney('contradicts');
  const next = startNextStep(original, 'A second experiment', LATER);
  const archived = clone(next.attempts);
  assert.notEqual(next.skills, next.attempts[0].skills);
  assert.notEqual(original.skills, next.attempts[0].skills);
  original.skills.push('persistence');
  assert.deepEqual(next.attempts, archived);
  const corrected = correction(freeze(next), {story:'I only watched.',skills:['coordination'],direction:'Try a different role'});
  assert.deepEqual(corrected.attempts, archived);
  assert.deepEqual(corrected.skills, []);
  assert.equal(corrected.stage, 'skills');
  corrected.attempts[0].skills.push('persistence');
  assert.deepEqual(next.attempts, archived);
  assert.throws(() => correction(next, {attempts:[]}));
});

function fillAttempts() {
  let record = readyJourney();
  for (let i = 0; i < 20; i++) {
    record = saveAnswer(record, 'reflection', {outcome:`Reported result ${i}`,evidenceStatus:i % 2 ? 'contradicts' : 'uncertain'}, LATER);
    record = startNextStep(record, `Experiment ${i + 1}`, LATER);
  }
  return record;
}

test('twenty-attempt capacity fails explicitly with no silent pruning or lost current outcome', () => {
  const full = saveAnswer(fillAttempts(), 'reflection', {outcome:'Do not discard this current result',evidenceStatus:'supports'}, LATER);
  const before = JSON.stringify(full);
  assert.equal(full.attempts.length, 20);
  assert.ok(isJourney(full));
  assert.throws(() => startNextStep(freeze(full), 'One more experiment', LATER), /20 earlier attempts.*Export.*explicitly remove/);
  assert.equal(JSON.stringify(full), before);
  assert.deepEqual(parseJourneyBackup(exportJourney(full)), full);
});

test('explicit attempt removal deletes only the named snapshot and frees one slot', () => {
  const full = saveAnswer(fillAttempts(), 'reflection', {outcome:'Ready to keep another result',evidenceStatus:'supports'}, LATER);
  const removedId = full.attempts[7].id;
  const next = removeAttempt(freeze(full), removedId, LATER);
  assert.equal(next.attempts.length, 19);
  assert.deepEqual(next.attempts, full.attempts.filter(attempt => attempt.id !== removedId));
  assert.equal(next.outcome, full.outcome);
  assert.equal(next.nextStep, full.nextStep);
  assert.equal(next.decisions.at(-1).kind, 'attempt-removed');
  assert.deepEqual(next.decisions.at(-1).fields, ['attempts']);
  assert.ok(!JSON.stringify(next).includes('Reported result 7'));
  for (const id of [removedId, 'missing', null, 7]) assert.throws(() => removeAttempt(next, id, LATER));
  const resumed = startNextStep(next, 'Another action after deliberate deletion', LATER);
  assert.equal(resumed.attempts.length, 20);
  assert.equal(new Set(resumed.attempts.map(attempt => attempt.id)).size, 20);
  assert.equal(resumed.attempts.at(-1).outcome, full.outcome);
  assert.deepEqual(parseJourneyBackup(exportJourney(resumed)), resumed);
});

test('malformed, duplicate, future-dated, and unsupported archived attempts are rejected', () => {
  const base = startNextStep(reviewedJourney(), 'Another action', LATER);
  const snapshot = base.attempts[0];
  const invalidAttempts = [
    null, Array(1), [null], [{...snapshot,id:'unknown'}], [{...snapshot,id:'attempt-999999'}],
    [{...snapshot,at:'2026-11-01T12:00:00.000Z'}], [{...snapshot,score:100}],
    [{...snapshot,outcome:''}], [{...snapshot,evidenceStatus:'unreviewed'}],
    [{...snapshot,story:'x'.repeat(3001)}], [{...snapshot,skills:['coordination','coordination']}],
    [snapshot,snapshot], Array.from({length:21}, () => snapshot)
  ];
  for (const attempts of invalidAttempts) {
    const record = {...base,attempts};
    assert.equal(isJourney(record), false);
    assert.throws(() => parseJourneyBackup(JSON.stringify(record)));
  }
});

test('all twenty maximally bounded and escaped snapshots remain exportable and importable', () => {
  const limits = {interest:300,story:3000,direction:600,reward:600,constraints:1000,nextStep:1500};
  let record = readyJourney();
  record = correction(record, Object.fromEntries(Object.entries(limits).map(([field, length]) => [field,'\u0000'.repeat(length)])));
  record = answer(record, 'skills', ['planning']);
  record = answer(record, 'direction', record.direction);
  record = answer(record, 'reward', record.reward);
  record = answer(record, 'constraints', record.constraints);
  record = answer(record, 'action', record.nextStep);
  for (let i = 0; i < 20; i++) {
    record = saveAnswer(record, 'reflection', {outcome:'\u0000'.repeat(1500),evidenceStatus:'uncertain'}, LATER);
    record = startNextStep(record, '\u0000'.repeat(1500), LATER);
  }
  const exported = exportJourney(record);
  assert.ok(exported.length > 500000);
  assert.ok(exported.length < 2000000);
  assert.deepEqual(parseJourneyBackup(exported), record);
});
