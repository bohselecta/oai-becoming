import test from "node:test";
import assert from "node:assert/strict";
import { Store, secret } from "../src/store.mjs";
import {
  placement,
  estimate,
  eligible,
  createProject,
  projectStatus,
  reviewEvidence,
  submitEvidence,
  RUBRIC,
  PROTOCOL,
  CRITERIA,
} from "../src/measurement.mjs";
import { randomBytes } from "node:crypto";
const today = new Date().toISOString().slice(0, 10);
const makeStore = () =>
  new Store(":memory:", randomBytes(32).toString("base64"));
function participant(
  store,
  id,
  mark = 2,
  skills = ["research"],
  mode = "independent",
  count = 3,
) {
  const s = store.read(id);
  s.consent = {
    storage: true,
    compare: true,
    displayName: "TEST FIXTURE " + id,
  };
  for (const skill of skills)
    for (let i = 0; i < count; i++)
      s.evidence.push({
        id: `${id}-${skill}-${mode}-${i}`,
        demonstrationId: `${id}-${skill}-${mode}-${i}`,
        skill,
        mode,
        mark,
        status: "accepted",
        date: today,
        rubric: RUBRIC,
        protocol: PROTOCOL,
        assessmentCriterion: CRITERIA[skill],
        projectId: null,
      });
  store.save(id, s);
  return s;
}
test("C7 unknown is not observed zero; accepted marks require three distinct recent compatible observations", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  const s = participant(store, "test-zero", 0);
  assert.equal(estimate(s, "research", "independent").score, 0);
  const fresh = store.read("test-unknown");
  assert.equal(estimate(fresh, "research", "independent").score, null);
  s.evidence[0].status = "pending";
  assert.equal(estimate(s, "research", "independent").score, null);
  s.evidence[0].status = "rejected";
  assert.equal(estimate(s, "research", "independent").score, null);
  s.evidence[0].status = "revoked";
  assert.equal(estimate(s, "research", "independent").score, null);
  s.evidence[0].status = "accepted";
  s.evidence[0].date = "2000-01-01";
  assert.equal(estimate(s, "research", "independent").score, null);
  s.evidence[0].date = "2999-01-01";
  assert.equal(estimate(s, "research", "independent").score, null);
});
test("C7 duplicate, rubric, protocol, criterion and assistance incompatibility cannot generate placement", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  const original = participant(store, "test-person");
  for (const [field, value] of [
    ["demonstrationId", original.evidence[1].demonstrationId],
    ["rubric", "wrong"],
    ["protocol", "wrong"],
    ["assessmentCriterion", "unsupported"],
    ["mode", "assisted"],
  ]) {
    const s = structuredClone(original);
    s.evidence[0][field] = value;
    assert.equal(estimate(s, "research", "independent").score, null, field);
  }
  const s = structuredClone(original);
  s.evidence[0].mark = 5;
  assert.equal(estimate(s, "research", "independent").score, null);
});
test("C7 small samples suppress percentiles; compatible sample lower endpoint remains explicitly zero", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  participant(store, "test-subject", 0);
  for (let i = 0; i < 29; i++) participant(store, "test-reference-" + i, 3);
  let p = placement(store, "test-subject", "research", "independent");
  assert.equal(p.sampleSize, 29);
  assert.equal(p.percentile, null);
  participant(store, "test-reference-29", 3);
  p = placement(store, "test-subject", "research", "independent");
  assert.equal(p.percentile, 0);
  assert.equal(p.index.percentile, 0);
  assert.equal(p.index.score, 0);
  const before = p.referenceVersion;
  const revoked = store.read("test-reference-29");
  revoked.consent.compare = false;
  store.save("test-reference-29", revoked);
  p = placement(store, "test-subject", "research", "independent");
  assert.equal(p.sampleSize, 29);
  assert.equal(p.percentile, null);
  assert.notEqual(p.referenceVersion, before);
  const own = store.read("test-subject");
  own.consent.compare = false;
  store.save("test-subject", own);
  assert.deepEqual(
    placement(store, "test-subject", "research", "independent").references,
    [],
  );
});
test("C7 index uses exactly the same observed basket, fixed weights and assistance condition for references", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  participant(store, "test-subject", 2, ["research", "systems"]);
  participant(store, "test-incomplete", 4, ["research"]);
  participant(store, "test-assisted", 4, ["research", "systems"], "assisted");
  participant(store, "test-full", 1, ["research", "systems"]);
  const p = placement(store, "test-subject", "research", "independent");
  assert.equal(p.index.score, 500);
  assert.deepEqual(p.index.basket, ["systems", "research"]);
  assert.equal(p.sampleSize, 2);
  assert.equal(p.index.sampleSize, 1);
  assert.equal(p.coverage.observedCapabilities, 2);
  assert.equal(p.index.components.find((e) => e.skill === "story").score, null);
});
test("C8 project target freezes real reference, completion never awards marks, accepted project evidence meets and revoke reopens", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  const s = participant(store, "test-subject", 2);
  participant(store, "test-peer", 3);
  createProject(store, "test-subject", s, {
    skill: "research",
    mode: "independent",
    targetScore: 750,
    title: "Research project",
    nextAction: "Triangulate the decision",
    criterion: "Disclose uncertainty and alternatives",
    participantId: "test-peer",
  });
  s.consent.compare = false;
  assert.equal(
    projectStatus(store, "test-subject", s, s.projects[0]),
    "reference-unavailable",
  );
  s.consent.compare = true;
  const p = s.projects[0],
    target = structuredClone(p.target);
  p.practiceDone = true;
  assert.equal(projectStatus(store, "test-subject", s, p), "open");
  assert.deepEqual(p.target, target);
  assert.equal(estimate(s, "research", "independent").score, 500);
  s.evidence = [];
  for (let i = 0; i < 3; i++)
    s.evidence.push({
      id: "project-evidence-" + i,
      demonstrationId: "project-evidence-" + i,
      skill: "research",
      mode: "independent",
      mark: 4,
      status: "accepted",
      date: today,
      rubric: RUBRIC,
      protocol: PROTOCOL,
      assessmentCriterion: CRITERIA.research,
      projectId: p.id,
    });
  assert.equal(
    projectStatus(store, "test-subject", s, p),
    "met-with-accepted-evidence",
  );
  s.evidence[0].status = "revoked";
  assert.equal(projectStatus(store, "test-subject", s, p), "open");
  const peer = store.read("test-peer");
  peer.evidence[0].status = "revoked";
  store.save("test-peer", peer);
  assert.equal(
    projectStatus(store, "test-subject", s, p),
    "reference-unavailable",
  );
  assert.deepEqual(p.target, target);
});
test("C6 actual reviewer role, storage consent, pending status and fresh revision required for acceptance", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  const s = store.read("test-subject");
  s.consent.storage = true;
  submitEvidence(s, {
    demonstrationId: "work-1",
    title: "Work",
    account: "Actual work to be inspected",
    criterion: "Documented test criterion",
    date: today,
    skill: "research",
    mode: "independent",
  });
  store.save("test-subject", s);
  const e = s.evidence[0];
  assert.throws(
    () =>
      reviewEvidence(
        store,
        "test-reviewer",
        "test-subject",
        e.id,
        "accepted",
        2,
        "Inspected actual work",
        0,
        false,
      ),
    /authorized/,
  );
  assert.throws(
    () =>
      reviewEvidence(
        store,
        "test-subject",
        "test-subject",
        e.id,
        "accepted",
        2,
        "Inspected actual work",
        0,
        true,
      ),
    /authorized/,
  );
  assert.throws(
    () =>
      reviewEvidence(
        store,
        "test-reviewer",
        "test-subject",
        e.id,
        "accepted",
        2,
        "Inspected actual work",
        1,
        true,
      ),
    /reload/,
  );
  assert.throws(
    () =>
      reviewEvidence(
        store,
        "test-reviewer",
        "test-subject",
        e.id,
        "accepted",
        5,
        "Inspected actual work",
        0,
        true,
      ),
    /bounded mark/,
  );
  reviewEvidence(
    store,
    "test-reviewer",
    "test-subject",
    e.id,
    "accepted",
    2,
    "Inspected actual work",
    0,
    true,
  );
  assert.throws(
    () =>
      reviewEvidence(
        store,
        "test-reviewer",
        "test-subject",
        e.id,
        "accepted",
        2,
        "Inspected actual work",
        1,
        true,
      ),
    /pending/,
  );
  assert.throws(
    () =>
      submitEvidence(store.read("test-subject"), { demonstrationId: "work-1" }),
    /already recorded/,
  );
});
test("C4 encrypted transactional revisions roll back failed writes; request reuse cannot replay another operation", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  const id = "test-subject";
  assert.throws(
    () =>
      store.change(id, 0, "request-one", { a: 1 }, (s) => {
        s.consent.storage = true;
        throw new Error("failed");
      }),
    /failed/,
  );
  assert.equal(store.read(id).revision, 0);
  store.change(
    id,
    0,
    "request-one",
    { a: 1 },
    (s) => (s.consent.storage = true),
  );
  assert.equal(
    store.change(id, 0, "request-one", { a: 1 }, () => {
      throw new Error("must not run");
    }).replayed,
    true,
  );
  assert.throws(
    () => store.change(id, 1, "request-one", { a: 2 }, () => {}),
    /fresh request ID/,
  );
  store.db.prepare("UPDATE users SET payload=? WHERE id=?").run("tampered", id);
  assert.throws(() => store.read(id), /not been replaced/);
  assert.throws(
    () => store.change(id, 1, "request-new", {}, () => {}),
    /not been replaced/,
  );
  assert.equal(
    store.db.prepare("SELECT payload FROM users WHERE id=?").get(id).payload,
    "tampered",
  );
});
test("C9 consent withdrawal and erasure remove all observation eligibility, comparison and person-target status", (t) => {
  const store = makeStore();
  t.after(() => store.close());
  const s = participant(store, "test-subject");
  participant(store, "test-peer", 3);
  createProject(store, "test-subject", s, {
    skill: "research",
    mode: "independent",
    targetScore: 750,
    title: "Test project",
    nextAction: "Try the actual task",
    criterion: "Record what would count",
    participantId: "test-peer",
  });
  const peer = store.read("test-peer");
  peer.consent.storage = false;
  store.save("test-peer", peer);
  assert.equal(
    projectStatus(store, "test-subject", s, s.projects[0]),
    "reference-unavailable",
  );
  s.consent.storage = false;
  assert.deepEqual(eligible(s, "research", "independent"), []);
  store.erase("test-peer");
  assert.equal(
    placement(store, "test-subject", "research", "independent").sampleSize,
    0,
  );
});
