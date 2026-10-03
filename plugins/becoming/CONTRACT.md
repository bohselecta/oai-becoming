# Becoming in ChatGPT — implementation contract

## Current finish-pass authority — October 3, 2026

This instruction supersedes earlier broad setup/cost/submission authority in this
repository. Continue the existing Auth0 + Render pilot with **no new spending**.
Do not create paid resources, upgrade plans, accept new paid commitments, configure
credentials for ongoing access, or expand security permissions without explicit
approval. Secrets belong only in approved provider secret storage, never chat,
Git, screenshots or logs. Existing account access permits inspection, not an
unlimited grant to change access. Coordinate Mac browser/account work through the
parent task; this cloud checkout cannot control that Mac.

Verified source changes may be merged under repository protections and main CI
must be checked. **Do not submit or publicly publish the app before Hayden's
final review and approval.** OpenAI acceptance is a separate external milestone.
Personal testing needs no recruited comparison cohort: unknown placement with an
empty real sample is correct. Thirty references apply only to an aggregate
percentile claim. No fabricated people, rankings, screenshots or review evidence.

Contract `becoming-chatgpt/1`, frozen before implementation, October 1, 2026.
Publisher requested by owner: **Corgi-Verse Software**. Author and existing
copyright/licensing remain Hayden Lindley. Codex builds; ChatGPT hosts the user
conversation and embedded UI. This is an Apps SDK app backed by MCP, not a legacy
`ai-plugin.json` plugin or a Codex tool bundle.

## Authorized scope

Build locally, install development dependencies, test with disposable fixtures,
write documentation, push a review branch and open a draft PR. No purchases,
agreements, deployment, submission, merge or publication. The owner's personal
review is the final publication gate. Preserve newer/unrelated work and all
existing app behavior, keys, fixtures, licensing and static deployment settings.
The owner-requested integration authorizes an isolated backend; the predecessor's
no-backend rule continues to govern the standalone demonstration.

## Continuation authorization — October 1, 2026

The owner's latest instruction supersedes the build-only action holds above:
real OAuth/ChatGPT setup, agreements, costs, deployment and submission are authorized
without another approval request. The current delivery target is an invite-only
personal test **before general-use submission**. Auth0 + Render and Hayden's DBA
Corgi-Verse Software are owner-selected. The specific publisher grant is in
`docs/PUBLISHER-GRANT.md`; existing licenses remain unchanged. Missing credentials,
account-owned settings and unverified current agreement text remain real execution
limits, not renewed permission requirements.

## Semantic promises

- C1 — Preserve the existing static/portable app and its complete discovery,
  unfavorable placement, evidence-review, revocation and growth paths. No browser
  record is silently uploaded. Integration code lives in `plugins/becoming`.
- C2 — A real MCP Streamable HTTP server advertises and executes strict tools,
  structured results, annotations, OAuth metadata and a working embedded widget.
  Both current MCP UI metadata and ChatGPT compatibility metadata are provided.
- C3 — Authenticate using a configured external OAuth/OIDC authorization server.
  Validate signature, issuer, resource audience, expiry, subject and scopes.
  User identity comes only from the token; callers cannot select another user.
  Login/account controls use authorization code + PKCE, state, nonce, secure
  sessions and CSRF. No production fixture mode or default accounts.
- C4 — Persist correctable interest-led records using the existing journey
  transitions. Revisions prevent lost updates. Request IDs make retries safe.
  Contradictory/uncertain reflections stay explicit; story corrections invalidate
  old action confirmations; new steps preserve previous completed attempts.
- C5 — Consent is obtained through a human-operated account page, never a model
  tool. Storage and identifiable participant comparison have separate grants.
  Withdrawal immediately blocks access and removes downstream eligibility.
  Export/import and explicit account erase work, including session invalidation.
  Restores validate and never silently replace current state.
- C6 — Evidence submissions are unassessed pending accounts. Only an authenticated,
  separately authorized human reviewer can accept an observation with a bounded
  mark, rationale and versioned conditions. No self-review or model acceptance.
  Evidence is inspectable, correctable by replacement, individually revocable;
  revoked/rejected/pending evidence cannot change placement.
- C7 — Real comparisons use only compatible, distinct, recent accepted evidence
  and opted-in real participants. Independent/assisted conditions stay separate.
  Show score meaning, date, coverage, references, conditions, uncertainty and
  sample size. Unknown is not zero. Percentiles require at least 30 compatible
  reference people and describe only the participating sample. No claim of
  empirical assessment validation, intrinsic worth or population benchmarks.
  The pre-existing fictional dataset is never ingested by the integration.
- C8 — Concrete growth projects freeze a selected threshold/person, sample
  version, observed basis, assistance condition and starting evidence. Practice
  completion never awards marks. Success requires accepted project evidence;
  withdrawals/revocations recompute status without rewriting the target.
- C9 — No scraping or invented profile statistics. Provider/profile capabilities
  without a supported authorized adapter are explicitly unavailable. Private
  records and raw evidence do not enter logs, analytics, widget state or public
  resources. Model-visible data is deliberate; exports stay in the account page.
- C10 — Provide installation/setup, listing assets, privacy/data-control drafts,
  publisher requirements, license conflict decision, release receipts, automated
  tests and repo-written handoff. Distinguish unfinished code, fixture checks,
  live checks awaiting setup, and manual account/legal/publication steps.

## Interfaces and recovery

Separate Node backend with a durable SQLite database, an external issuer and
first-party account/reviewer pages. The embedded widget reads tool results and
calls MCP tools through the ChatGPT bridge; it has no direct network access or
stored credentials. Account management is a browser link, not a model-grant path.
Errors fail closed: unauthenticated, insufficient scope, consent required,
stale revision, invalid input, unavailable comparison/provider and storage failure
are distinct. Durable writes are transactional; corrupt data is not overwritten.

The integration keeps forest green, warm neutrals, original mark and calm editorial
hierarchy. UI states cover initial consent, empty/returning record, question,
correction, pending evidence, placement unknown/known, concrete project and errors.
Keyboard controls, readable narrow layout and literal hostile-text rendering are
required. No affiliation/endorsement claim.

## Verification limits

Local OAuth identities and reviewer/reference people are explicitly labeled test
fixtures, never shipped as participants. A fixture-host harness can verify the
actual transport/UI code but cannot certify the live ChatGPT sandbox or real IdP.
Official requirements are checked against accessible current primary sources;
blocked documentation and publication requirements remain explicit live gates.

## Deployment preparation amendment — October 1, 2026

An explicit setup-only server can reserve the actual provider URL before Auth0
registration. It must label itself setup-required, expose no account/MCP/OAuth
service, create no database/session and never activate on authentication failure.
Normal operation still requires strict issuer/audience/scopes, consent and pilot
invitations. Render may generate a stable protected secret; existing base64-key
configurations must stay compatible and conflicting key inputs fail closed.
