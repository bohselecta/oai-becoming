import { createHash } from "node:crypto";
import { requireThat, AppError, secret } from "./store.mjs";
export const CAPABILITIES = [
  "systems",
  "research",
  "story",
  "prototype",
  "facilitation",
  "creative",
];
export const CRITERIA = {
  systems:
    "Map dependencies, identify one constraint, and test a change against a stated outcome.",
  research:
    "Triangulate a claim with independent sources, disclose uncertainty, and explain what would change the decision.",
  story:
    "Explain a complex idea to a named audience, retain the key trade-off, and check understanding.",
  prototype:
    "Build a testable artifact, obtain concrete feedback, and revise against the stated need.",
  facilitation:
    "Make a shared decision process explicit, invite relevant contributions, and resolve a recorded disagreement.",
  creative:
    "Produce and compare alternatives against a stated creative brief, explain choices, and refine the result.",
};
export const RUBRIC = "becoming-observed/1";
export const PROTOCOL = "becoming-reviewed-demonstration/1";
export const RECENCY_DAYS = 180;
export const MARKS = [
  "0 — submitted work does not demonstrate the selected capability under these conditions",
  "1 — partial demonstration with major unresolved errors or missing steps",
  "2 — adequate demonstration against the recorded criterion",
  "3 — clear, complete demonstration with justified decisions",
  "4 — consistently complete demonstration including limitations and alternatives",
];
export const MEASUREMENT_NOTICE =
  "Descriptive reviewed observations in a consenting participating sample, not a validated aptitude test or a population benchmark. Observed ranges are not confidence intervals. Scores do not describe human worth. Self-report and project completion never award proficiency.";

export function eligible(
  state,
  skill,
  mode,
  today = new Date().toISOString().slice(0, 10),
) {
  if (!state.consent.storage) return [];
  const cutoff = Date.parse(today) - RECENCY_DAYS * 86400000;
  const seen = new Set();
  return state.evidence
    .filter((e) => {
      const ok =
        e.status === "accepted" &&
        e.skill === skill &&
        e.mode === mode &&
        e.rubric === RUBRIC &&
        e.protocol === PROTOCOL &&
        e.assessmentCriterion === CRITERIA[skill] &&
        Number.isInteger(e.mark) &&
        e.mark >= 0 &&
        e.mark <= 4 &&
        Date.parse(e.date) <= Date.parse(today) &&
        Date.parse(e.date) >= cutoff &&
        !seen.has(e.demonstrationId);
      if (ok) seen.add(e.demonstrationId);
      return ok;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    .slice(0, 12);
}
export function estimate(state, skill, mode, today) {
  const evidence = eligible(state, skill, mode, today);
  if (evidence.length < 3)
    return {
      score: null,
      n: evidence.length,
      evidenceIds: evidence.map((e) => e.id),
      range: null,
    };
  const marks = evidence.map((e) => e.mark);
  return {
    score: (marks.reduce((a, b) => a + b, 0) / marks.length) * 250,
    n: marks.length,
    evidenceIds: evidence.map((e) => e.id),
    range: [Math.min(...marks) * 250, Math.max(...marks) * 250],
  };
}
export function placement(
  store,
  id,
  skill,
  mode,
  today = new Date().toISOString().slice(0, 10),
) {
  const state = store.read(id);
  const own = estimate(state, skill, mode, today);
  const references = !state.consent.compare
    ? []
    : store
        .all()
        .filter(
          (p) =>
            p.id !== id && p.state.consent.storage && p.state.consent.compare,
        )
        .map((p) => ({
          participantId: p.id,
          displayName: p.state.consent.displayName,
          ...estimate(p.state, skill, mode, today),
        }))
        .filter((p) => p.score !== null);
  const referenceVersion = createHash("sha256")
    .update(
      JSON.stringify({
        skill,
        mode,
        today,
        references: references
          .map((p) => [p.participantId, p.score, p.evidenceIds])
          .sort(),
      }),
    )
    .digest("hex");
  const percentile =
    own.score === null || references.length < 30
      ? null
      : Math.round(
          (100 * references.filter((p) => p.score <= own.score).length) /
            references.length,
        );
  const indexEntries = CAPABILITIES.map((c) => ({
    skill: c,
    ...estimate(state, c, mode, today),
  }));
  const basket = indexEntries.filter((e) => e.score !== null);
  const indexScore = basket.length
    ? basket.reduce((sum, e) => sum + e.score, 0) / basket.length
    : null;
  const compositeReferences =
    !state.consent.compare || !basket.length
      ? []
      : store
          .all()
          .filter(
            (p) =>
              p.id !== id && p.state.consent.storage && p.state.consent.compare,
          )
          .map((p) => {
            const entries = basket.map((e) =>
              estimate(p.state, e.skill, mode, today),
            );
            return entries.some((e) => e.score === null)
              ? null
              : {
                  participantId: p.id,
                  score:
                    entries.reduce((sum, e) => sum + e.score, 0) /
                    entries.length,
                  evidenceIds: entries.flatMap((e) => e.evidenceIds),
                };
          })
          .filter(Boolean);
  const compositeVersion = createHash("sha256")
    .update(
      JSON.stringify({
        mode,
        today,
        basket: basket.map((e) => e.skill),
        references: compositeReferences.sort((a, b) =>
          a.participantId.localeCompare(b.participantId),
        ),
      }),
    )
    .digest("hex");
  return {
    kind: "real-consenting-participating-sample",
    skill,
    mode,
    rubric: RUBRIC,
    protocol: PROTOCOL,
    asOf: today,
    recencyDays: RECENCY_DAYS,
    ...own,
    coverage: { observedCapabilities: basket.length, totalCapabilities: 6 },
    index: {
      score: indexScore,
      basket: basket.map((e) => e.skill),
      components: indexEntries,
      weights:
        "Fixed equal capability weights, renormalized over observed capabilities only",
      sampleSize: compositeReferences.length,
      referenceVersion: compositeVersion,
      percentile:
        indexScore === null || compositeReferences.length < 30
          ? null
          : Math.round(
              (100 *
                compositeReferences.filter((p) => p.score <= indexScore)
                  .length) /
                compositeReferences.length,
            ),
      notice:
        "Same observed capability basket and assistance condition for every reference; participating sample only.",
    },
    sampleSize: references.length,
    percentile,
    referenceVersion,
    references,
    comparisonAvailable: state.consent.compare,
    notice: MEASUREMENT_NOTICE,
    unknownReason:
      own.score === null
        ? "At least three distinct recent accepted compatible demonstrations are needed."
        : percentile === null
          ? "At least 30 compatible opted-in reference participants are needed for a sample percentile."
          : null,
  };
}
export function submitEvidence(state, input) {
  requireThat(
    state.evidence.length < 200,
    "CAPACITY",
    "Export and explicitly remove old evidence before adding more. No evidence was pruned.",
  );
  requireThat(
    !state.evidence.some(
      (e) =>
        e.demonstrationId === input.demonstrationId && e.status !== "revoked",
    ),
    "DUPLICATE_DEMONSTRATION",
    "This demonstration is already recorded. Revoke it before submitting a correction.",
  );
  requireThat(
    input.date <= new Date().toISOString().slice(0, 10),
    "FUTURE_EVIDENCE",
    "An observation cannot be in the future.",
  );
  if (input.projectId)
    requireThat(
      state.projects.some(
        (p) =>
          p.id === input.projectId &&
          p.skill === input.skill &&
          p.mode === input.mode,
      ),
      "PROJECT_MISMATCH",
      "Evidence must match an existing project and assistance condition.",
    );
  state.evidence.push({
    id: secret(),
    demonstrationId: input.demonstrationId,
    skill: input.skill,
    mode: input.mode,
    title: input.title,
    account: input.account,
    date: input.date,
    criterion: input.criterion,
    provenance:
      "User-submitted account; reviewer must inspect the actual demonstration.",
    rubric: RUBRIC,
    protocol: PROTOCOL,
    assessmentCriterion: CRITERIA[input.skill],
    status: "pending",
    mark: null,
    review: null,
    projectId: input.projectId || null,
    submittedAt: new Date().toISOString(),
  });
}
export function reviewEvidence(
  store,
  reviewerId,
  ownerId,
  evidenceId,
  decision,
  mark,
  rationale,
  expectedRevision,
  reviewerAllowed,
) {
  requireThat(
    reviewerAllowed && reviewerId !== ownerId,
    "REVIEW_FORBIDDEN",
    "Only a separately authorized reviewer may review another participant.",
    403,
  );
  return store.transact(() => {
    const s = store.read(ownerId);
    requireThat(
      s.consent.storage,
      "CONSENT_REQUIRED",
      "The participant withdrew storage consent.",
      403,
    );
    requireThat(
      s.revision === expectedRevision,
      "STALE_REVISION",
      "Evidence changed; reload before reviewing.",
      409,
    );
    const e = s.evidence.find((e) => e.id === evidenceId);
    requireThat(
      e?.status === "pending",
      "NOT_PENDING",
      "Only pending evidence can be reviewed.",
    );
    requireThat(
      ["accepted", "rejected"].includes(decision),
      "REVIEW_DECISION",
      "Choose accept or reject.",
    );
    requireThat(
      Number.isInteger(mark) &&
        mark >= 0 &&
        mark <= 4 &&
        rationale.trim().length >= 10 &&
        rationale.length <= 1500,
      "REVIEW_INVALID",
      "A bounded mark and concrete rationale are required.",
    );
    e.status = decision;
    e.mark = decision === "accepted" ? mark : null;
    e.review = { reviewerId, at: new Date().toISOString(), rationale };
    s.revision++;
    store.save(ownerId, s);
    return s;
  });
}
export function createProject(store, id, state, input) {
  requireThat(
    state.projects.length < 50,
    "CAPACITY",
    "Export and explicitly remove a project before adding another.",
  );
  const p = placement(store, id, input.skill, input.mode);
  let target = input.targetScore;
  let person = null;
  if (input.participantId) {
    person = p.references.find((r) => r.participantId === input.participantId);
    requireThat(
      person,
      "REFERENCE_UNAVAILABLE",
      "The selected participant is unavailable or not authorized.",
    );
    requireThat(
      person.score < 1000,
      "RUBRIC_CEILING",
      "This person is at the rubric ceiling; choose an explicit match threshold instead.",
    );
    target = person.score + 1;
  }
  requireThat(
    target >= (p.score ?? 0) && target <= 1000,
    "TARGET_INVALID",
    "Choose a reachable threshold at or above the current observed score.",
  );
  state.projects.push({
    id: secret(),
    title: input.title,
    nextAction: input.nextAction,
    criterion: input.criterion,
    skill: input.skill,
    mode: input.mode,
    target: {
      score: target,
      participantId: person?.participantId || null,
      personName: person?.displayName || null,
      referenceScore: person?.score ?? null,
      referenceVersion: p.referenceVersion,
      referenceEvidenceIds: person?.evidenceIds || [],
      asOf: p.asOf,
      rubric: RUBRIC,
      protocol: PROTOCOL,
      startingScore: p.score,
      startingEvidenceIds: p.evidenceIds,
    },
    practiceDone: false,
    createdAt: new Date().toISOString(),
    notice: "Frozen observed target. Rank improvement is never guaranteed.",
  });
}
export function projectStatus(store, id, state, project) {
  if (project.target.participantId) {
    if (!state.consent.compare) return "reference-unavailable";
    const person = store.read(project.target.participantId);
    const observation = estimate(person, project.skill, project.mode);
    if (
      !person.consent.storage ||
      !person.consent.compare ||
      observation.score === null ||
      project.target.referenceEvidenceIds.some(
        (eid) =>
          !eligible(person, project.skill, project.mode).some(
            (e) => e.id === eid,
          ),
      )
    )
      return "reference-unavailable";
  }
  const e = eligible(state, project.skill, project.mode);
  const value = estimate(state, project.skill, project.mode);
  return value.score !== null &&
    value.score >= project.target.score &&
    e.some((e) => e.projectId === project.id)
    ? "met-with-accepted-evidence"
    : "open";
}
