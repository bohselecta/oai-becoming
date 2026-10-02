# Release evidence — local integration, publication held

Package `becoming-chatgpt-app/0.1.0`, contract `becoming-chatgpt/1`.
Original app preserved at baseline `b044e6dffab10ed9ae62158e71203a36a3510ed2`.
Review branch: `codex/becoming-chatgpt-app`.

## Local acceptance

| Contract | Status | Evidence and practical limit |
|---|---|---|
| C1 | PASS | Original 152 Node tests and both builds; all four existing-app browser suites passed: 238 served comparison, 297 served discovery, 232 portable comparison, 294 portable discovery = 1,061 assertions. No runtime errors/external requests. App source, keys, data and licenses preserved. |
| C2 | PASS | 11 strict executable tools, structured output schemas, public widget resource, official MCP client over actual HTTP; top-level/mirrored OAuth metadata verified on wire. |
| C3 | PASS locally | Official MCP OAuth client completes discovery, client registration, S256 code exchange and consented calls against test-only IdP. Actual browser account login exercises PKCE/state/nonce. Missing/expired/old/wrong audience/issuer/signature/scope tokens, hostile Origin, invalid CSRF, self/unauthorized review and cross-user inputs fail. |
| C4 | PASS | Full discovery/contradiction/correction/new-attempt path, retries/stale revision, encrypted durable restart and rollback tested. |
| C5 | PASS locally | Human account grant/withdrawal, complete export, validated confirmed restore, account erase/session invalidation/old authorization rejection tested. Operator backups/IdP/chat history outside code control. |
| C6 | PASS locally | Pending/rejected/revoked/stale/incompatible/duplicate evidence cannot grant independent placement. Separate reviewer HTTP boundary and role enforcement tested. Actual demonstration legitimacy still depends on real human inspection. |
| C7 | PASS locally | Unknown/zero, small/30-person samples, unfavorable zero percentile, compatible same-basket indices, fixed criteria, distinctness, recency and assisted separation tested with explicitly synthetic test references only. No real population/calibration claim. |
| C8 | PASS locally | Frozen person/threshold target, practice without score, accepted project evidence, revocation reopening and withdrawn person basis tested. |
| C9 | PASS locally | No fixture imports in runtime, no profile scraping/API adapter, no telemetry/direct widget network, encrypted private payload inspection and literal hostile text rendering checked. |
| C10 | PASS for preparation | Contract/checklist written before building; installation, architecture, privacy draft, listing assets, publisher/license decisions, CI and handoff supplied. Draft PR/source publication status recorded in handoff. |
| LIVE | NOT_RUN | Real ChatGPT developer-mode/sandbox and chosen real OAuth provider require approved setup; fixture bridge cannot certify them. |
| PUBLICATION | NOT_RUN | Owner personal review, license/publisher/privacy decisions, agreements, cost and deployment/submission approval remain required. |

Integration Node acceptance comprises **11 tests** with full protocol/domain paths.
The integration browser suite comprises **23 assertions**, zero page errors and
actual desktop/phone captures. Both use synthetic identities; the widget shows
**TEST FIXTURE** and the server starts with no participants in normal operation.
An npm audit of the pinned runtime dependency tree reported zero known vulnerabilities
when checked; that is not a security audit. Dependency notices are preserved.

The committed [local receipt](verification/local-receipt.json) identifies the tested
source checkpoint, individual runtime/test SHA-256 hashes and browser counts.
The clean source checkpoint is `7a3027daeba17f86e008b7a6a0f0544443a5450d`. Receipt commits may add documentation/images afterward; a checkpoint is not a
claim that every later commit was tested. The exact current-head CI workflows
[Product verification](https://github.com/bohselecta/oai-becoming/actions/workflows/check.yml)
and [ChatGPT app verification](https://github.com/bohselecta/oai-becoming/actions/workflows/chatgpt-app.yml)
record source revision/tree and publish actual receipts/screenshots. Check the draft
PR's exact head and check results, not a badge or historical receipt.

Both GitHub CI gates passed at `17d897664e8217bcd796b5eb75cf97beb9aba209`: [Product verification](https://github.com/bohselecta/oai-becoming/actions/runs/36944969439) and [ChatGPT app verification](https://github.com/bohselecta/oai-becoming/actions/runs/36944969417). [Exact-source CI receipt](verification/ci-receipt.json). This receipt commit adds documentation only; later-head status must be checked separately.

## Actual defects repaired during acceptance

- Browser POSTs under `Referrer-Policy: no-referrer` sent a null Origin, preventing
  legitimate consent forms. `same-origin` preserves strict Origin/CSRF checks and
  suppresses cross-origin referrers; the checks were not relaxed to accept null.
- Implicit labels containing selects were ambiguous to browser label lookup.
  Widget controls now use explicit label/control associations.
- Tool rerender initially reset selected capability/assistance conditions. Nonprivate
  selector preferences now persist for each form; measurement data always recomputes.
- Corrected first-use layout exposes one discovery question and collapses evidence,
  record/correction, comparison and project controls until requested.
- Reviewer/server restart teardown and test-page UTF-8 encoding were repaired in
  fixtures; no production fixture identities or bypass routes were introduced.

## Unfinished code versus external gates

No stubs, TODO implementations or unimplemented required tools remain in the
contracted single-process OAuth/OIDC integration. The following capabilities are
explicitly **unavailable**, not silently simulated: public-profile adapters,
representative population benchmarks, empirical assessment calibration, legal
identity verification, opaque-token introspection, IdP-specific client-auth methods
other than none/client_secret_post, pairwise-sub identity mapping and distributed
multi-replica storage. They must not be advertised as implemented. Choosing a provider
outside the documented supported contract requires new adapter engineering.

Live setup and account/legal/publication actions are detailed separately in
[HANDOFF.md](../HANDOFF.md), [INSTALL.md](../INSTALL.md) and [LIVE-TESTS.md](LIVE-TESTS.md).
No production deployment, tunnel, paid provider, agreement acceptance or app submission
was performed. Human usability, screen-reader, independent security and empirical
measurement reviews remain unperformed; automated browser checks do not replace them.
