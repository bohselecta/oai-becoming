# Current state — Becoming 0.3.0 review branch

## Scope and contract

Owner-authorized interest-led simplification of Becoming, based on `main` commit `23b4f4c399e5a10321ccaa02a9acde00d613869e`. Review branch: `codex/interest-led-becoming`. [Draft PR #4](https://github.com/bohselecta/oai-becoming/pull/4) stays open and unmerged for joint review. No production deployment is authorized or claimed.

Read `docs/DISCOVERY-CONTRACT.md` (D1–D8), which supersedes dashboard-first presentation while preserving `becoming-product/2` measurement invariants. `Today`, `Your record`, and `Explore demo` are the primary navigation. The actual local record and the complete synthetic comparison instrument are separate.

## Implemented

One-question interest-led journey, explicitly reported current-setting skills, freely chosen direction/reward/constraints/next step, reflection with supports/contradicts/uncertain status, correctable durable context, metadata-only correction log, intentional past-attempt snapshots, validated backup export/import confirmation, explicit erase, corrupt/future-version recovery and session-only warnings.

Changing the story clears its old action confirmations. Correcting a current step invalidates its dependent conclusion; choosing a new step retains the completed attempt with its original account and uncertainty. Up to 20 attempts are kept, inspectable and removable, without silent pruning. The UI states guided prompts, no live AI; it diagnoses nothing, never scores a visitor, and never turns gaming skills into an unsupported transfer claim.

`src/domain.js`, `src/participants.js`, the original styles, original measurement regression assertions, original mark, current license and legacy notice remain unchanged. All old measurement routes remain usable inside the explicit fictional demo, including low scores, evidence provenance, assistance conditions and revocation.

## Verification and receipts

Baseline: 100 Node tests and both builds passed. Current local suite: 152 tests and both builds passed. The generated portable bundle also passed JavaScript syntax validation.

At `b52af7ded72e8596649ffc8d3628583034619295`, exact-head GitHub CI passed 238 hosted comparative, 297 hosted discovery and 232 portable comparative browser assertions. The remaining portable discovery run exposed a test-only Window property redefinition during simulated reopen. That shim lifecycle was corrected, retaining the strict no-runtime-errors check. The final gate is the [latest exact-head PR checks](https://github.com/bohselecta/oai-becoming/pull/4/checks), not a historical green run or the earlier partial receipt.

Both complete browser runners now execute against both the served modular build and the portable build. CI artifacts include source-revision.txt, source-tree.txt, JSON receipts and actual screenshots. The committed hosted receipt records its source explicitly. The committed fresh desktop/phone, next-step and record captures are actual `b52af7d` renders and were independently inspected. The phone CTA is within a 390×844 viewport.

Local Chromium process startup was blocked by the authoring host’s socket policy; the provided cloud browser also blocked loopback navigation. No policy was changed or bypassed. GitHub CI supplies actual hosted-origin reload, headers, browser interaction and rendering evidence.

## Next-agent entry

Read `AGENTS.md`, `LICENSE`, `docs/LICENSE-HISTORY.md`, `docs/BRAND.md`, `docs/DISCOVERY-CONTRACT.md`, and this file. Check PR #4’s exact current head and its own CI receipts before claiming completion. Run `npm run check`, then both browser runners against portable and served builds. Preserve old unfavorable/unknown/pending/assisted tests and new context/history/storage boundaries. Never merge this PR without a later explicit instruction.

No human usability session, screen-reader audit, empirical measurement validation, live model integration, account service, or production release is claimed. The first-use flow remains authored guided logic, not a responsive live-AI companion.
