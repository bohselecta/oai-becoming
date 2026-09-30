# Current state — Becoming 0.3.0

## Scope and contract

Owner-authorized interest-led simplification of Becoming, based on `main` commit `23b4f4c399e5a10321ccaa02a9acde00d613869e`. The owner reviewed [PR #4](https://github.com/bohselecta/oai-becoming/pull/4) and explicitly approved merging it into main and refreshing the README with current screenshots and text. The README now follows the product introduction, value, requirements, install, core usage, advanced configuration and project/license sequence. No production deployment is authorized or claimed.

Read `docs/DISCOVERY-CONTRACT.md` (D1–D8), which supersedes dashboard-first presentation while preserving `becoming-product/2` measurement invariants. `Today`, `Your record`, and `Explore demo` are the primary navigation. The actual local record and the complete synthetic comparison instrument are separate.

## Implemented

One-question interest-led journey, explicitly reported current-setting skills, freely chosen direction/reward/constraints/next step, reflection with supports/contradicts/uncertain status, correctable durable context, metadata-only correction log, intentional past-attempt snapshots, validated backup export/import confirmation, explicit erase, corrupt/future-version recovery and session-only warnings.

Changing the story clears its old action confirmations. Correcting a current step invalidates its dependent conclusion; choosing a new step retains the completed attempt with its original account and uncertainty. Up to 20 attempts are kept, inspectable and removable, without silent pruning. The UI states guided prompts, no live AI; it diagnoses nothing, never scores a visitor, and never turns gaming skills into an unsupported transfer claim.

`src/domain.js`, `src/participants.js`, the original styles, original measurement regression assertions, original mark, current license and legacy notice remain unchanged. All old measurement routes remain usable inside the explicit fictional demo, including low scores, evidence provenance, assistance conditions and revocation.

## Verification and receipts

Baseline: 100 Node tests and both builds passed. Current local suite: 152 tests and both builds passed. The generated portable bundle also passed JavaScript syntax validation.

At `91b145adb675ee170270f59c9ab4b6f27d7b22d8`, both [PR CI](https://github.com/bohselecta/oai-becoming/actions/runs/36776489243) and [push CI](https://github.com/bohselecta/oai-becoming/actions/runs/36776483807) passed all four browser suites: 238 hosted comparative, 297 hosted discovery, 232 portable comparative and 294 portable discovery assertions, with no runtime errors or external requests. This verifies the implementation before the README refresh; check the [current workflow](https://github.com/bohselecta/oai-becoming/actions/workflows/check.yml) for the exact later documentation or merge commit. The committed [complete receipt](verification/0.3.0-complete.json) remains an explicitly historical pass at `2157a7e`.

Both complete browser runners execute against both the served modular build and the portable build. CI artifacts include source-revision.txt, source-tree.txt, JSON receipts and actual screenshots. The four committed desktop/phone, next-step and record captures are byte-for-byte identical to the final `91b145ad` CI renders and were independently inspected. The phone CTA is within a 390×844 viewport.

Local Chromium process startup was blocked by the authoring host’s socket policy; the provided cloud browser also blocked loopback navigation. No policy was changed or bypassed. GitHub CI supplies actual hosted-origin reload, headers, browser interaction and rendering evidence.

## Next-agent entry

Read `AGENTS.md`, `LICENSE`, `docs/LICENSE-HISTORY.md`, `docs/BRAND.md`, `docs/DISCOVERY-CONTRACT.md`, and this file. Check the exact current main or review-branch commit and its own CI receipts before claiming completion. Run `npm run check`, then both browser runners against portable and served builds. Preserve old unfavorable/unknown/pending/assisted tests and new context/history/storage boundaries. The later owner instruction authorizes merging PR #4 and the README revision; it does not authorize deployment or license changes.

No human usability session, screen-reader audit, empirical measurement validation, live model integration, account service, or production release is claimed. The first-use flow remains authored guided logic, not a responsive live-AI companion.
