# Architecture and implemented contracts

## Boundaries

The existing root app keeps its own zero-dependency static/portable build and
browser storage keys. This package imports only the pure `src/journey.js`
transitions; it never imports `src/domain.js` or `src/participants.js`. Real
integration records and the fictional demo cannot share participants or marks.
No data is silently moved between browser storage and the account database.

ChatGPT calls `/mcp` through the official MCP SDK's stateless Streamable HTTP
transport. Tool/resource discovery is public; private tool execution verifies
audience-bound bearer JWTs and human-granted storage consent. UI is returned as
an HTML resource and calls the host's `window.openai.callTool`; it performs no
runtime direct network requests. First-party account/review controls are outside
the widget and require browser OIDC sessions and CSRF. No model API is called by
the backend; the host conversation is provided by ChatGPT.

`src/auth.mjs`: trusted OIDC discovery, remote JWKS validation, code + PKCE login,
state/cookie binding, nonce, RFC 9207 issuer handling and one-hour sessions.
`src/http.mjs`: bounded HTTP bodies, Host/Origin checks, account forms, CSRF,
consent/export/import/erase and reviewer workspace. A same-origin referrer policy
preserves browser POST Origin checks without sending URL details cross-origin.
`src/store.mjs`: private SQLite rows, AES-256-GCM payloads bound to row IDs,
HMAC account IDs, transactions, revisions, receipt hashes and expiring sessions.
`src/measurement.mjs`: explicit real-observation eligibility/comparison/projects.
`src/tools.mjs`: strict tool schemas, public descriptors/resources, authorization
checks, deliberate model-visible results and error codes.

## Tools

Every write requires `expectedRevision` and a new bounded `requestId`; retries of
the exact same operation do not repeat it within the latest 100 receipts. A retry
returns current state, not a historical private-text snapshot. Read after a stale
revision, reconfirm the intended edit, then send a new ID. Callers cannot supply a
user ID. The identity is always derived from the verified token issuer/subject.

| Tool | Behavior | Scopes |
|---|---|---|
| `becoming_open` | Load consent state or the correctable record | read |
| `becoming_save_answer` | Commit one stage, including contradiction/uncertainty | read + write |
| `becoming_correct_record` | Correct fields and clear dependent conclusions/actions | read + write |
| `becoming_next_step` | Preserve completed attempt and choose next action | read + write |
| `becoming_remove_attempt` | Explicitly remove named earlier attempt | read + write |
| `becoming_submit_evidence` | Submit pending actual-demonstration account | read + write |
| `becoming_revoke_evidence` | Withdraw eligibility; preserve inspectable account | read + write |
| `becoming_remove_evidence` | Explicitly delete named evidence account | read + write |
| `becoming_placement` | Capability + same-basket index, condition and legitimate sample | read |
| `becoming_create_project` | Freeze threshold/person basis and concrete action | read + write |
| `becoming_update_project` | Practice completion without marks; explicit removal | read + write |

All scope names carry the `becoming:` prefix. Read tools declare read-only;
destructive/correction/revocation tools declare destructive hints. Those hints do
not grant authority; the server enforces access. There is no MCP consent, review,
role-grant, export-upload or account-erasure tool. Account controls cannot be
invoked through the widget bridge. Invalid/missing authorization receives a real
HTTP challenge or `mcp/www_authenticate` tool hint as appropriate.

## Observation and comparison meaning

The six original capability IDs are preserved. `becoming-observed/1` is a new,
explicitly **unvalidated descriptive** rubric; its criterion per capability is in
`CRITERIA`, with five mark anchors in `MARKS`. The assistance condition is
`independent` or `assisted`. Review protocol is `becoming-reviewed-demonstration/1`.
The participant's own proposed task criterion is contextual; comparisons use the
fixed capability assessment criterion, matching rubric/protocol and assistance
condition. A reviewer must inspect actual work against those conditions, document
rationale and attest inspection. Account text alone is not verified performance.

A compatible estimate uses 3–12 distinct recent accepted demonstrations within
180 days, excluding future, pending, rejected, revoked or incompatible entries.
The score is the mean mark × 250, with a descriptive min/max observed range.
Missing is null; a valid mean mark of zero is zero. Index weights are fixed and
equal over the six original capabilities; missing capabilities are excluded,
coverage stays separate, and every comparator index uses exactly the subject's
observed basket. Index components and evidence IDs expose the arithmetic.

References are actual stored consenting accounts only. A participant must grant
storage and comparison; chosen display names are not verified legal identities.
Sample percentile is the fraction of compatible references at or below the
subject, rounded to a whole percentage, and requires 30 references. This is not a
representative population claim or calibrated confidence interval. Sample versions
hash the actual eligible references, conditions and date. Withdrawals change that
version and suppress insufficient samples. No fixture dataset is shipped or seeded.

A concrete project freezes observed target score/person, reference version/date,
rubric/protocol/condition, starting evidence and intended demonstration. Practice
completion is separate from success. Success requires an eligible project-linked
observation plus a sufficient compatible estimate. Revocation reopens success;
withdrawal or loss of any frozen person-reference evidence makes the person basis
unavailable. Model-visible project results redact the withdrawn person's name and
reference marks while retaining the user's frozen goal. Historical shared metadata
can remain in the owner's private export, as disclosed in privacy text.

## Persistence, limits and recovery

One process owns one durable SQLite database. All account payloads and session/login
flow payloads are encrypted; transient browser tokens are indexed only by hash.
Foreign user IDs are never accepted in private MCP inputs. Reviewer forms address
opaque IDs but enforce the separately configured reviewer role and no self-review.
Writes are synchronous transactions with revision checks; receipt hashes avoid
retaining replaced input text. Schema versions newer than this implementation fail
without migration/replacement. Corrupt ciphertext is not silently replaced.

Limits: 20 completed discovery attempts (existing journey contract), 50 projects,
200 evidence accounts, 100 retry receipts. Capacity errors require explicit removal;
no accepted evidence, project or completed attempt is silently pruned. Login flows
expire after 10 minutes; sessions/tokens at most one hour. Application requests are
rate-limited to 120 per socket IP per minute. A reverse proxy needs its own approved
rate/abuse controls; the server intentionally does not trust arbitrary forwarded IPs.

Storage withdrawal blocks all private MCP activity and downstream evidence
eligibility; the account page still permits export and erasure. Comparison withdrawal
removes identifiable comparison visibility. Individual evidence revocation is not
undone by consent restoration. A complete export includes submitted evidence/projects,
but confirmed restore imports only the validated discovery record and never trusts
imported accepted marks. Delete removes active private rows and sessions; opaque
erasure tombstones prevent old tokens resurrecting an account. Backups, chat history,
operator/IdP logs and external copies require separate deletion procedures.

This is not a distributed database, identity proofing service, assessment calibration
system or automatic content-moderation service. Review capacity, participant abuse,
operational data retention and independent security/usability audits remain release
considerations; current code implements the advertised local contracts.
