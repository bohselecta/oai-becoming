# ChatGPT app integration — review branch, separate from 0.3.1

The October 1 owner request adds a real Apps SDK/MCP integration in
`plugins/becoming`, with Corgi-Verse Software as the requested publisher. The baseline
below remains the verified standalone app at `b044e6dffab10ed9ae62158e71203a36a3510ed2`.
Its application source, fixtures, storage keys, licenses and static deployment
settings are preserved. New backend code is separately packaged; no automatic
browser upload, live model API call, deployment or publication is claimed.

Start with the
[integration handoff](https://github.com/bohselecta/oai-becoming/blob/codex/becoming-chatgpt-app/plugins/becoming/HANDOFF.md),
[contract](https://github.com/bohselecta/oai-becoming/blob/codex/becoming-chatgpt-app/plugins/becoming/CONTRACT.md)
and [release evidence](https://github.com/bohselecta/oai-becoming/blob/codex/becoming-chatgpt-app/plugins/becoming/docs/RELEASE.md).
These are online repository links; the portable static app does not include the
separate server. The handoff distinguishes local fixture verification, live tests
awaiting setup and manual account/license/privacy/publication gates. The owner’s
personal review is the final publication gate.

---

# Current state — Becoming 0.3.1

## Scope and contract

Owner-authorized branding patch over the merged interest-led 0.3.0 product on `main` commit `c9c45059506a2c3ed5887043811188d71c8598ba`. [PR #5](https://github.com/bohselecta/oai-becoming/pull/5) makes the intended ecosystem unmistakable as **ChatGPT + OpenAI**, introduces the new Becoming person-and-rising-path mark, refreshes actual product screenshots, and leaves discovery/measurement behavior intact. The October 1 consolidation request authorizes bringing the pending work into main. PRs #1–#4 were already merged; the three historical squash-merged branch tips exactly match their recorded merge trees and contain no omitted work. PR #5 is the only additional product change. No production deployment is authorized or claimed.

Read `docs/DISCOVERY-CONTRACT.md` (D1–D8), which supersedes dashboard-first presentation while preserving `becoming-product/2` measurement invariants. `Today`, `Your record`, and `Explore demo` are the primary navigation. The actual local record and the complete synthetic comparison instrument are separate.

## Implemented

One-question interest-led journey, explicitly reported current-setting skills, freely chosen direction/reward/constraints/next step, reflection with supports/contradicts/uncertain status, correctable durable context, metadata-only correction log, intentional past-attempt snapshots, validated backup export/import confirmation, explicit erase, corrupt/future-version recovery and session-only warnings.

Changing the story clears its old action confirmations. Correcting a current step invalidates its dependent conclusion; choosing a new step retains the completed attempt with its original account and uncertainty. Up to 20 attempts are kept, inspectable and removable, without silent pruning. The UI states guided prompts, no live AI; it diagnoses nothing, never scores a visitor, and never turns gaming skills into an unsupported transfer claim.

`src/domain.js`, `src/participants.js`, journey/discovery state contracts, measurement fixtures, current license and legacy notice remain unchanged. The visible brand layer changes: `public/mark.svg`, secondary ecosystem copy, comparative brand CSS, metadata, README imagery and brand-specific regression assertions. All old measurement routes remain usable inside the explicit fictional demo, including low scores, evidence provenance, assistance conditions and revocation.

## Verification and receipts

Baseline: 100 Node tests and both builds passed. Current local suite: 152 tests and both builds passed. The generated portable bundle also passed JavaScript syntax validation.

At `d0b082dae183cd439ad3a140819c011eb443af47`, the [0.3.1 PR run](https://github.com/bohselecta/oai-becoming/actions/runs/36791725253) passed all four browser suites: **238 served comparative, 297 served discovery, 232 portable comparative and 294 portable discovery assertions** — **1,061 total** — with no runtime errors or external requests. `npm run check` passed all **152 Node tests** and both builds. This is the behavioral/rendering proof for the branding implementation; check the [current workflow](https://github.com/bohselecta/oai-becoming/actions/workflows/check.yml) for the exact later documentation/removal commit. The [0.3.1 receipt](verification/0.3.1-branding.json) records that exact baseline and image hashes. Earlier 0.3.0 receipts remain historical.

Both complete browser runners execute against both the served modular build and the portable build. CI artifacts include source-revision.txt, source-tree.txt, JSON receipts and actual screenshots. The four committed desktop/phone, next-step and record captures were regenerated from the real served 0.3.1 interface and independently inspected. The desktop view shows Becoming primary with subordinate **ChatGPT** and **OpenAI** ecosystem tags; the 390-pixel phone capture preserves the same hierarchy without overflow.

Local Chromium process startup was blocked by the authoring host’s socket policy; the provided cloud browser also blocked loopback navigation. No policy was changed or bypassed. GitHub CI supplies actual hosted-origin reload, headers, browser interaction and rendering evidence.

## Next-agent entry

Read `AGENTS.md`, `LICENSE`, `docs/LICENSE-HISTORY.md`, `docs/BRAND.md`, `docs/DISCOVERY-CONTRACT.md`, and this file. Check the exact current main or review-branch commit and its own CI receipts before claiming completion. Run `npm run check`, then both browser runners against portable and served builds. Preserve old unfavorable/unknown/pending/assisted tests and context/history/storage boundaries. For branding, keep Becoming primary; ChatGPT/OpenAI are secondary textual ecosystem references unless exact official assets and applicable OpenAI permission/terms are available. No deployment or license change is authorized by this patch.

No human usability session, screen-reader audit, empirical measurement validation, live model integration, account service, or production release is claimed. The first-use flow remains authored guided logic, not a responsive live-AI companion.

## ChatGPT pilot continuation — October 1, 2026

The static app remains the unchanged 0.3.1 baseline. Separate integration setup
continues on draft [PR #6](https://github.com/bohselecta/oai-becoming/pull/6). Start at
[the direct-link pilot guide](../plugins/becoming/docs/SETUP-NOW.md) and
[handoff](../plugins/becoming/HANDOFF.md). The owner authorized real setup/deployment
and selected Auth0 + Render, Corgi-Verse Software as his DBA, and an intended contact
mailbox. Specific publisher rights are recorded without changing the root license.
The hosted configuration uses an exact-subject pilot gate and one persistent disk.
Real deployment, OAuth, ChatGPT sandbox and general-use submission are not claimed.
