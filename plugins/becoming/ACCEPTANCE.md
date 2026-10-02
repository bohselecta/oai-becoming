# Acceptance checklist — becoming-chatgpt/1

Written before building. Final evidence will record PASS / FAIL / NOT_RUN /
NOT_APPLICABLE against these IDs, exact source and environment.

| ID | Observable acceptance |
|---|---|
| C1 | Original Node suite, modular + portable builds and both browser suites on both formats pass; existing app files and licenses preserved. |
| C2 | Official MCP client initializes, lists tools/resources, reads UI and executes tools over actual HTTP; schemas, annotations and auth challenges inspected. |
| C3 | Valid OAuth works; absent/expired/wrong issuer/audience/signature/scope tokens fail; account PKCE/state/nonce, session and CSRF paths exercised; no cross-user access. |
| C4 | Interest → example → chosen actions/direction/reward/constraints → step → contradiction → return/restart → correction → new step; optimistic concurrency and retries tested. |
| C5 | Model cannot grant consent; human account grant/revoke/export/import/erase tested; erase invalidates old bearer access and sessions; data survives restart before deletion. |
| C6 | Pending/self-submitted/rejected/duplicate/stale/assisted/revoked evidence cannot manufacture independent accepted placement; authorized reviewer decision and correction tested. |
| C7 | Unknown and measured zero distinct; low placement remains visible; incompatible/small samples cannot produce percentile; compatible opt-in samples and individual withdrawal tested. |
| C8 | Project basis immutable; checklist does not improve placement; accepted project evidence can satisfy target; revocation reopens; comparator withdrawal invalidates person target. |
| C9 | No fixture participants in runtime; no unsupported provider calls, scraping, telemetry, private resource leakage or token logging; hostile text rendered literally. |
| C10 | Docs/assets/privacy/publisher/license/release/handoff files complete; review branch pushed and draft PR linked; no deployment/submission/agreement/spend. |
| LIVE | Actual ChatGPT developer-mode install, real OAuth account and embedded sandbox journeys tested after approved setup. NOT_RUN until setup exists. |
| PUBLICATION | Owner personally reviews and approves exact source, license/publisher/privacy and destination before publication. NOT_RUN until explicit approval. |
