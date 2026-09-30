/** A local, user-authored discovery record. It never assesses or awards a skill.
 * This module is deliberately separate from the synthetic measurement engine.
 */
export const JOURNEY_KEY = 'becoming-journey-v1';
export const JOURNEY_VERSION = 1;
export const JOURNEY_STAGES = Object.freeze([
  'interest', 'story', 'skills', 'direction', 'reward', 'constraints', 'action', 'ready', 'reflection'
]);
export const SKILL_OPTIONS = Object.freeze([
  {id:'planning', label:'Planning', description:'I broke something down into steps or made a plan.'},
  {id:'coordination', label:'Coordination', description:'I brought people, information, or tasks together.'},
  {id:'persistence', label:'Persistence', description:'I kept working through a difficulty.'},
  {id:'adaptation', label:'Adaptation', description:'I changed my approach when something did not work.'}
].map(option => Object.freeze(option)));

const LIMITS = Object.freeze({interest:300, story:3000, direction:600, reward:600, constraints:1000, nextStep:1500, outcome:1500});
const EDITABLE = [...Object.keys(LIMITS), 'skills', 'evidenceStatus'];
const HISTORY_FIELDS = [...EDITABLE, 'attempts'];
const RECORD_KEYS = ['version', 'revision', 'stage', 'interest', 'story', 'skills', 'direction', 'reward', 'constraints', 'nextStep', 'outcome', 'evidenceStatus', 'attempts', 'decisions', 'updatedAt'];
const ATTEMPT_KEYS = ['id', 'at', 'interest', 'story', 'skills', 'direction', 'reward', 'constraints', 'nextStep', 'outcome', 'evidenceStatus'];
const EVIDENCE_STATES = ['unreviewed', 'supports', 'contradicts', 'uncertain'];
const REQUIRED = [['interest','interest'], ['story','story'], ['direction','direction'], ['reward','reward'], ['action','nextStep']];
const INVALIDATES_OUTCOME = ['story', 'skills', 'direction', 'nextStep'];
const MAX_DECISIONS = 50;
const MAX_ATTEMPTS = 20;
const MAX_BACKUP_LENGTH = 2000000;
const BACKUP_FORMAT = 'becoming-local-record/1';
const NOTICE = 'This local record contains the user’s own account and choices, not an assessed score or proof that a skill transfers. Reflection may support, contradict, or leave a direction uncertain. Exporting downloads a copy; it does not upload or share it.';

export function freshJourney() {
  return {version:JOURNEY_VERSION, revision:0, stage:'interest', interest:'', story:'', skills:[], direction:'', reward:'', constraints:'', nextStep:'', outcome:'', evidenceStatus:'unreviewed', attempts:[], decisions:[], updatedAt:null};
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function plainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, keys, label) {
  requireCondition(plainObject(value), `${label} must be an object.`);
  const ownKeys = Reflect.ownKeys(value);
  requireCondition(ownKeys.length === keys.length && ownKeys.every(key => keys.includes(key)), `${label} has missing or unsupported fields.`);
  requireCondition(ownKeys.every(key => 'value' in Object.getOwnPropertyDescriptor(value, key)), `${label} cannot contain computed properties.`);
}

function denseArray(value, maximum, label) {
  requireCondition(Array.isArray(value) && value.length <= maximum, `${label} is invalid or too long.`);
  requireCondition(Reflect.ownKeys(value).length === value.length + 1 && Array.from({length:value.length}, (_, i) => Object.hasOwn(value, i)).every(Boolean), `${label} must be a plain list.`);
}

function validTimestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function validateField(field, value, required = false) {
  if (Object.hasOwn(LIMITS, field)) {
    requireCondition(typeof value === 'string' && value.length <= LIMITS[field], `${field === 'nextStep' ? 'Next step' : field[0].toUpperCase() + field.slice(1)} must be text of at most ${LIMITS[field]} characters.`);
    requireCondition(!required || value.trim().length > 0, 'Add an answer before continuing.');
  } else if (field === 'skills') {
    denseArray(value, SKILL_OPTIONS.length, 'Selected actions');
    requireCondition(value.every(id => SKILL_OPTIONS.some(option => option.id === id)) && new Set(value).size === value.length, 'Choose each available action at most once.');
  } else if (field === 'evidenceStatus') {
    requireCondition(EVIDENCE_STATES.includes(value), 'Choose whether the result supports, contradicts, or leaves your direction uncertain.');
  } else {
    throw new Error('This field cannot be changed.');
  }
}

function checkPrerequisites(record, stage) {
  const position = JOURNEY_STAGES.indexOf(stage);
  for (const [requiredStage, field] of REQUIRED) {
    if (JOURNEY_STAGES.indexOf(requiredStage) < position) {
      requireCondition(record[field].trim().length > 0, `Complete ${requiredStage === 'action' ? 'your next step' : requiredStage} before continuing.`);
    }
  }
}

function validateJourney(record) {
  exactKeys(record, RECORD_KEYS, 'Discovery record');
  requireCondition(record.version === JOURNEY_VERSION, 'This record uses an unsupported version. Keep the original copy.');
  requireCondition(Number.isSafeInteger(record.revision) && record.revision >= 0, 'The record revision is invalid.');
  requireCondition(JOURNEY_STAGES.includes(record.stage), 'The discovery stage is invalid.');
  for (const field of EDITABLE) validateField(field, record[field]);
  checkPrerequisites(record, record.stage);
  requireCondition(record.evidenceStatus === 'unreviewed' ? record.outcome === '' : record.outcome.trim().length > 0, 'A reviewed result needs an outcome; an unreviewed action cannot claim one.');
  if (record.evidenceStatus !== 'unreviewed') checkPrerequisites(record, 'reflection');
  denseArray(record.attempts, MAX_ATTEMPTS, 'Earlier attempts');
  const attemptIds = new Set();
  record.attempts.forEach(attempt => {
    exactKeys(attempt, ATTEMPT_KEYS, 'Earlier attempt');
    requireCondition(typeof attempt.id === 'string' && /^attempt-[1-9]\d*$/.test(attempt.id) && Number.isSafeInteger(Number(attempt.id.slice(8))) && Number(attempt.id.slice(8)) <= record.revision && !attemptIds.has(attempt.id), 'An earlier attempt has an invalid or duplicate identifier.');
    attemptIds.add(attempt.id);
    requireCondition(validTimestamp(attempt.at) && validTimestamp(record.updatedAt) && attempt.at <= record.updatedAt, 'An earlier attempt has an invalid date.');
    for (const field of EDITABLE) validateField(field, attempt[field], !['skills', 'constraints', 'evidenceStatus'].includes(field));
    requireCondition(attempt.evidenceStatus !== 'unreviewed', 'An earlier attempt needs its reported result.');
  });
  denseArray(record.decisions, MAX_DECISIONS, 'Decision history');
  requireCondition(record.decisions.length === Math.min(record.revision, MAX_DECISIONS), 'The decision history does not match this revision.');
  let previousAt = null;
  record.decisions.forEach((event, index) => {
    exactKeys(event, ['revision', 'at', 'kind', 'fields'], 'Decision event');
    requireCondition(event.revision === record.revision - record.decisions.length + index + 1, 'Decision revisions are incompatible.');
    requireCondition(validTimestamp(event.at) && (!previousAt || event.at >= previousAt), 'A decision date is invalid.');
    requireCondition(['answer', 'correction', 'next-step', 'attempt-removed'].includes(event.kind), 'The decision event type is invalid.');
    denseArray(event.fields, HISTORY_FIELDS.length, 'Changed fields');
    requireCondition(event.fields.length > 0 && event.fields.every(field => HISTORY_FIELDS.includes(field)) && new Set(event.fields).size === event.fields.length, 'A decision event contains invalid fields.');
    previousAt = event.at;
  });
  if (record.revision === 0) {
    requireCondition(record.updatedAt === null && record.stage === 'interest' && record.skills.length === 0 && record.attempts.length === 0 && Object.keys(LIMITS).every(field => record[field] === ''), 'A new record cannot contain saved answers.');
  } else {
    requireCondition(validTimestamp(record.updatedAt) && record.updatedAt === previousAt, 'The saved date does not match the latest decision.');
  }
  return record;
}

export function isJourney(record) {
  try { validateJourney(record); return true; } catch { return false; }
}

function copyJourney(record) {
  return {...record, skills:[...record.skills], attempts:record.attempts.map(attempt => ({...attempt, skills:[...attempt.skills]})), decisions:record.decisions.map(event => ({...event, fields:[...event.fields]}))};
}

function upgradeEarlierRecord(record) {
  if (plainObject(record) && record.version === JOURNEY_VERSION && !Object.hasOwn(record, 'attempts')) {
    exactKeys(record, RECORD_KEYS.filter(field => field !== 'attempts'), 'Earlier discovery record');
    requireCondition(Array.isArray(record.decisions) && record.decisions.every(event => plainObject(event) && ['answer','correction'].includes(event.kind) && Array.isArray(event.fields) && !event.fields.includes('attempts')), 'An attempt history cannot be restored without its snapshots.');
    return {...record, attempts:[]};
  }
  return record;
}

function sameValue(a, b) {
  return Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((value, index) => value === b[index]) : a === b;
}

function resetStoryActions(previous, next, fields) {
  if (previous.story === next.story) return false;
  // Confirmed actions belong to one account. Even a combined correction must
  // return to a separate confirmation step before attaching actions to new text.
  next.skills = [];
  fields.add('skills');
  return true;
}

function invalidateOutcome(previous, next, fields) {
  if (INVALIDATES_OUTCOME.some(field => !sameValue(previous[field], next[field]))) {
    if (next.outcome !== '') fields.add('outcome');
    if (next.evidenceStatus !== 'unreviewed') fields.add('evidenceStatus');
    next.outcome = '';
    next.evidenceStatus = 'unreviewed';
  }
}

function recordDecision(previous, next, kind, fields, at) {
  requireCondition(previous.revision < Number.MAX_SAFE_INTEGER, 'This record has reached its revision limit. Export it before starting again.');
  requireCondition(validTimestamp(at), 'The save date is invalid.');
  // A device clock moving backward must not make a valid local record unreadable.
  const timestamp = previous.updatedAt && previous.updatedAt > at ? previous.updatedAt : at;
  next.revision = previous.revision + 1;
  next.updatedAt = timestamp;
  next.decisions.push({revision:next.revision, at:timestamp, kind, fields:[...fields]});
  next.decisions = next.decisions.slice(-MAX_DECISIONS);
  return validateJourney(next);
}

/** No mutation or storage access. Optional `at` makes transitions deterministic. */
export function saveAnswer(record, stage, value, at = new Date().toISOString()) {
  validateJourney(record);
  requireCondition(JOURNEY_STAGES.includes(stage) && stage !== 'ready', 'Choose an answerable discovery stage.');
  checkPrerequisites(record, stage);
  const next = copyJourney(record);
  const fields = new Set();
  if (stage === 'reflection') {
    exactKeys(value, ['outcome', 'evidenceStatus'], 'Reflection');
    validateField('outcome', value.outcome, true);
    validateField('evidenceStatus', value.evidenceStatus);
    requireCondition(value.evidenceStatus !== 'unreviewed', 'Choose what you learned from trying your next step.');
    next.outcome = value.outcome.trim();
    next.evidenceStatus = value.evidenceStatus;
    fields.add('outcome');
    fields.add('evidenceStatus');
    next.stage = 'ready';
  } else {
    const field = stage === 'action' ? 'nextStep' : stage;
    validateField(field, value, !['skills', 'constraints'].includes(stage));
    next[field] = Array.isArray(value) ? [...value] : value.trim();
    fields.add(field);
    resetStoryActions(record, next, fields);
    invalidateOutcome(record, next, fields);
    next.stage = JOURNEY_STAGES[JOURNEY_STAGES.indexOf(stage) + 1];
  }
  return recordDecision(record, next, 'answer', fields, at);
}

/** Validate a correction atomically; history records field names, never old text. */
export function correctJourney(record, patch, at = new Date().toISOString()) {
  validateJourney(record);
  requireCondition(plainObject(patch), 'Corrections must be an object.');
  const keys = Reflect.ownKeys(patch);
  requireCondition(keys.every(field => EDITABLE.includes(field) && 'value' in Object.getOwnPropertyDescriptor(patch, field)), 'This correction contains unsupported fields.');
  const next = copyJourney(record);
  const fields = new Set();
  for (const field of keys) {
    validateField(field, patch[field]);
    const value = Array.isArray(patch[field]) ? [...patch[field]] : patch[field].trim();
    if (!sameValue(value, record[field])) fields.add(field);
    next[field] = value;
  }
  if (fields.size === 0) return next;
  const storyChanged = resetStoryActions(record, next, fields);
  if (storyChanged && JOURNEY_STAGES.indexOf(record.stage) >= JOURNEY_STAGES.indexOf('skills')) next.stage = 'skills';
  invalidateOutcome(record, next, fields);
  // Removing an answer is permitted, but must reopen that part of the journey.
  const firstMissing = REQUIRED.find(([, field]) => next[field].trim().length === 0);
  if (firstMissing && JOURNEY_STAGES.indexOf(firstMissing[0]) < JOURNEY_STAGES.indexOf(next.stage)) next.stage = firstMissing[0];
  if (firstMissing && next.outcome !== '') {
    next.outcome = '';
    next.evidenceStatus = 'unreviewed';
    fields.add('outcome');
    fields.add('evidenceStatus');
  }
  return recordDecision(record, next, 'correction', fields, at);
}

/** Start another experiment without rewriting the context of a reported attempt. */
export function startNextStep(record, nextStep, at = new Date().toISOString()) {
  validateJourney(record);
  requireCondition(['ready', 'reflection'].includes(record.stage), 'Finish the current discovery questions before choosing another next step.');
  checkPrerequisites(record, 'reflection');
  validateField('nextStep', nextStep, true);
  requireCondition(validTimestamp(at), 'The save date is invalid.');
  const next = copyJourney(record);
  const fields = new Set(['nextStep']);
  if (record.outcome !== '') {
    requireCondition(record.attempts.length < MAX_ATTEMPTS, 'This record already keeps 20 earlier attempts. Export a copy, then explicitly remove an earlier attempt before starting another. Nothing has been removed.');
    const timestamp = record.updatedAt && record.updatedAt > at ? record.updatedAt : at;
    const attempt = {id:`attempt-${record.revision + 1}`, at:timestamp};
    for (const field of EDITABLE) attempt[field] = Array.isArray(record[field]) ? [...record[field]] : record[field];
    next.attempts.push(attempt);
    fields.add('attempts');
    fields.add('outcome');
    fields.add('evidenceStatus');
  }
  next.nextStep = nextStep.trim();
  next.outcome = '';
  next.evidenceStatus = 'unreviewed';
  next.stage = 'ready';
  return recordDecision(record, next, 'next-step', fields, at);
}

/** Only an explicit removal can drop an archived attempt; other snapshots stay. */
export function removeAttempt(record, id, at = new Date().toISOString()) {
  validateJourney(record);
  requireCondition(typeof id === 'string' && record.attempts.some(attempt => attempt.id === id), 'Choose an existing earlier attempt to remove.');
  const next = copyJourney(record);
  next.attempts = next.attempts.filter(attempt => attempt.id !== id);
  return recordDecision(record, next, 'attempt-removed', new Set(['attempts']), at);
}

/** Reading invalid data never rewrites it. UI must require explicit restore/reset. */
export function readJourney(storage) {
  let raw;
  try {
    const local = storage === undefined ? globalThis.localStorage : storage;
    requireCondition(local && typeof local.getItem === 'function', 'Local storage is unavailable.');
    raw = local.getItem(JOURNEY_KEY);
  } catch {
    return {record:freshJourney(), status:'unavailable', message:'Local saving is unavailable. Keep this session open and export a copy if you want to keep it.'};
  }
  if (raw === null) return {record:freshJourney(), status:'new'};
  try {
    requireCondition(typeof raw === 'string', 'The saved value is invalid.');
    const record = validateJourney(upgradeEarlierRecord(JSON.parse(raw)));
    return {record:copyJourney(record), status:'saved'};
  } catch {
    return {record:freshJourney(), status:'recovery', raw, message:'Your saved record could not be read safely. It has not been changed. Export the original, restore a compatible backup, or explicitly delete it before starting again.'};
  }
}

export function writeJourney(storage, record) {
  try {
    validateJourney(record);
    const local = storage === undefined ? globalThis.localStorage : storage;
    requireCondition(local && typeof local.setItem === 'function', 'Local storage is unavailable.');
    local.setItem(JOURNEY_KEY, JSON.stringify(record));
    return {ok:true};
  } catch {
    return {ok:false, message:'This change could not be saved locally. Keep this session open and export a copy before leaving.'};
  }
}

export function exportJourney(record) {
  validateJourney(record);
  return JSON.stringify({format:BACKUP_FORMAT, record, notice:NOTICE}, null, 2);
}

export function parseJourneyBackup(text) {
  requireCondition(typeof text === 'string' && text.length > 0 && text.length <= MAX_BACKUP_LENGTH, 'Choose a compatible Becoming backup smaller than 2,000,000 characters.');
  let input;
  try { input = JSON.parse(text); } catch { throw new Error('This file is not valid JSON. Your current record has not changed.'); }
  if (plainObject(input) && Object.hasOwn(input, 'format')) {
    exactKeys(input, ['format', 'record', 'notice'], 'Backup');
    requireCondition(input.format === BACKUP_FORMAT, 'This backup format is not supported. Keep the original copy.');
    requireCondition(typeof input.notice === 'string' && input.notice.length > 0 && input.notice.length <= 2000, 'The backup notice is invalid.');
    input = input.record;
  }
  return copyJourney(validateJourney(upgradeEarlierRecord(input)));
}

export function deleteJourney(storage) {
  try {
    const local = storage === undefined ? globalThis.localStorage : storage;
    requireCondition(local && typeof local.removeItem === 'function', 'Local storage is unavailable.');
    local.removeItem(JOURNEY_KEY);
    return {ok:true};
  } catch {
    return {ok:false, message:'The local record could not be deleted. It has not been reset. Try again when browser storage is available.'};
  }
}
