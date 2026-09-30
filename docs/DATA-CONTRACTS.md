# Data contracts and real-participant boundary

These are the implemented in-memory contracts, not public network endpoints. The comparative browser accepts no real assessed-participant uploads. Its measurement records remain synthetic. A separate personal discovery record now stores the visitor’s own unassessed words. These records never cross into the measurement engine.

## Subject state — version 2

`version`, `asOf`, `goal`, `mode`, `cohort`, `benchmarkVisible`, `sources`, `evidence[]`, `projects[]`, `adopted[]`, `audit[]`, `history[]`.

`asOf` is an ISO calendar date. `mode` is `independent` or `assisted`. Goals order opportunities without changing index weights. Source values are Boolean local grant simulations. The state validator checks shape and bounded values; it does not cryptographically prove a score or authorize a user.

## Evidence

```js
{
  id, demonstrationId, skill, source, mode,
  rubric: 'becoming-demo/1',
  protocol: 'becoming-demonstration/1',
  mark: 0 | 1 | 2 | 3 | 4,
  status: 'pending' | 'accepted' | 'rejected' | 'revoked',
  title, date, synthetic: true,
  provenance, assessor, rationale, reviewNote,
  project // optional project ID
}
```

`demonstrationId` deduplicates multiple records about the same demonstration. A source grant and a record's status are separate eligibility gates. Evidence requires an observation date, versioned assessment conditions and inspectable provenance. In this demo, `fixture://` identifiers are explanatory references to authored records, not remotely retrievable source URLs.

## Reference participant

```js
{
  schema: 'becoming-participant/1',
  id, displayName, subtitle,
  kind: 'synthetic', synthetic: true,
  permission: {
    basis: 'authored-synthetic-fixture',
    compare: true, profile: true, practices: true
  },
  referenceVersion, asOf,
  cohorts: ['global', /* explicit memberships */],
  observations: {
    independent: { research: { /* versioned observation */ } },
    assisted: { research: { /* separate observation */ } }
  },
  sharedBundles: ['investigator', /* intentionally shared bundle IDs */],
  notice
}
```

Each observation carries `rubric`, `protocol`, `mode`, `marks[]`, `synthetic`, `observedAt`, `accepted`, `assessmentId` and `source`. The snapshot contains all six capabilities for both modes. Marks are authored, deterministic fixtures. There are no assertions about similarly named real people.

The comparison engine reads this contract through `participantEstimate`, `cohortPeople`, `comparePeople` and `justAhead`. A production adapter would supply real authorized observations through a validated boundary rather than rebuilding those user flows. It must not simply flip `synthetic` to false and claim legitimacy.

## Frozen Surpass target

The target contains `type`, `personId`, `personName`, `referenceScore`, `targetScore`, `initialScore`, `initialPercentile`, `targetPercentile`, `relation`, `cohort`, `referenceVersion`, `asOf`, `mode`, `rubric`, `protocol`, `skill`, `evidenceIds`, `criterion`, `success`, and `rankNotice`.

Types are `person`, `baseline` or `threshold`. A rubric ceiling can produce an explicitly labeled `match-ceiling` relation; other goals are `surpass-threshold`. Changing the interface's context does not rewrite the target. A target percentile is null when a valid aggregate comparison is unavailable.

Project status alone is not evidence. Project completion requires eligible project evidence and an estimate satisfying the frozen success threshold. When evidence is revoked, the project can reopen without losing its original target.

## History snapshot

Each snapshot carries `id`, `date`, `label`, `referenceVersion` and independent/assisted measurements. Each mode has `score`, `coverage`, `basket[]`, per-capability `score`/`n`, and named-cohort percentiles. Null means unknown. No graph may coerce null into zero. Snapshot IDs and record IDs are unique within a session.

## Selective disclosure

`becoming-disclosure/2` exposes `synthetic`, purpose, rubric, as-of date, reference version, two condition-specific index summaries, twelve capability claims and a notice. It contains no raw evidence or private notes. The current packet is a local demonstration export, not a signed credential.

## Requirements for a real adapter — not implemented

Authenticate participants and reviewers. Verify identity only to the extent necessary for the selected disclosure. Represent permission scope, purpose, issuer, expiry and revocation explicitly. Separate profile visibility from permission to compare, publish practices and reuse source evidence. Public availability alone is not equivalent to unrestricted authorized reuse.

Carry source locators, assessment instances, dates, assistance/model/tool conditions, adjudication and rubric versions. Use independently assessed, multiple demonstrations. Reject incompatible or unsupported claims instead of inventing a score. Establish reference-snapshot integrity and a documented inclusion policy; explain participating samples without calling them entire populations.

Propagate withdrawal through source-derived scores, caches, public profiles, exported credentials and appropriate retained records. Define correction and appeal handling and evaluate the actual measurement before representing ranks as population facts. See `EVALUATION.md`.

## Local discovery record — version 1

Key `becoming-journey-v1`: `version`, `revision`, `stage`, `interest`, `story`, `skills[]`, `direction`, `reward`, `constraints`, `nextStep`, `outcome`, `evidenceStatus`, `attempts[]`, `decisions[]`, `updatedAt`.

Stages: interest, story, skills, direction, reward, constraints, action, ready, reflection. Text is bounded and escaped at every HTML boundary. Required earlier answers gate later stages. Selected actions are restricted to planning, coordination, persistence and adaptation; none maps automatically to a rubric, score or rank. `evidenceStatus` is unreviewed, supports, contradicts or uncertain, attached to the person’s own account and reflection. It is not an assessor judgment.

Decision events retain revision, timestamp, kind and changed field names only; at most 50 recent entries. A full backup uses `becoming-local-record/1` with the validated record and a notice. Bare version-1 records also restore. Unknown schema versions, malformed dates, nested shapes, fields and oversized input are rejected before replacement. Original synthetic keys/versions are not migrated or rewritten by discovery.

Changing story, skills, direction or nextStep invalidates the previous outcome. No correction silently creates an independent observation or proves transfer. Privacy controls download full private context only when chosen, validate restore before a confirmation, and erase just this local record.

A completed attempt is archived only when the person chooses a new next step. Each snapshot holds an ID, timestamp, original interest/story/actions/direction/reward/constraints, the tried action, outcome and uncertainty. It remains self-report about its original setting. At 20 attempts, continuation requires exporting/removing an old attempt; nothing is silently discarded. The exact earlier version-1 record without `attempts` can load with an empty array, without rewriting stored bytes until a later explicit save.
