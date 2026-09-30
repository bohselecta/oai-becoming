# Interest-led 0.3.0 verification

Frozen requirements: [D1–D8](DISCOVERY-CONTRACT.md). Baseline main `23b4f4c` passed 100 Node tests and both builds. The current unit/presentation/package suite passes 152 tests and both builds. Core measurement files and the original regression assertions remain unchanged.

## Executed browser evidence

At exact source `2157a7ed84734bdeca53a9f244327a706494eb72`, [GitHub CI](https://github.com/bohselecta/oai-becoming/actions/runs/36775816619) passed the complete gate:

| Suite | Result at that revision |
|---|---|
| Hosted comparative | PASS — 238 assertions |
| Hosted discovery | PASS — 297 assertions, actual localStorage reload and CSP |
| Portable comparative | PASS — 232 assertions |
| Portable discovery | PASS — 294 assertions, explicit offline Storage fault/reopen fixtures |

No runtime errors or external model/analytics/asset requests were observed. [Complete versioned receipt](verification/0.3.0-complete.json). The workflow checks out the PR head directly and includes source revision/tree files in its artifact. Consult the [latest exact-head PR gate](https://github.com/bohselecta/oai-becoming/pull/4/checks) for any later revision; an older receipt is not evidence for changed code.

The earlier `b52af7d` run passed both hosted suites and portable comparative verification, but the portable discovery harness could not redefine its test-only Window helper during a simulated reopen. Making that helper configurable fixed the harness lifecycle without changing production state or suppressing runtime errors. A parallel `2157a7e` PR run then exposed a CSP-sensitive plain-string polling predicate. Pollers now use explicit functions, preserving the strict product CSP and the no-errors assertions.

Actual screenshots from `b52af7d`: [desktop](../public/becoming-preview.png), [phone](../public/becoming-phone.png), [chosen step](../public/becoming-next-step.png), [record](../public/becoming-record.png). These depict test-entered local context, not a real visitor assessment. Independent visual review found no clipping, overlap or hierarchy blocker; the phone Continue control fits within 390×844 pixels. Subsequent production presentation is unchanged; final-run artifacts include refreshed captures.

## Requirements exercised

- D1–D3: one question, no fabricated personal score, chosen interest carried forward, optional confirmed actions, user-chosen direction/reward/constraints/action, no diagnosis or transfer claim
- D4: real-origin resume, inspect/correct, explicit uncertainty and contradiction, prior attempt preserved on next action, changed story clears stale action confirmations, removal controls and metadata-only correction log
- D5: strict schema and old-record migration, valid/corrupt/future data, quota/unavailable/delete failures, export/restore confirmation, no silent overwrite, separate synthetic key preserved byte for byte
- D6: original complete comparison → project → pending → acceptance → movement → revocation walkthrough, low/unknown/assisted/sparse-reference cases unchanged
- D7: both builds, keyboard errors/focus/modal replacement, reduced motion, accessible names, 320/390/768/1440 layouts, literal hostile text, CSP and no external requests
- D8: original author/mark/legal notices preserved, draft PR open and unmerged; final exact-head gate remains required before delivery

## Corrections made during verification

Code review caught stale skill confirmations after editing a story and lost context when choosing a new step. Both now have domain and browser regressions. Browser checks caught an omitted chosen-interest cue, and hidden stale form controls left inside a closed dialog. The prompt now uses saved interest explicitly, and final dialog closure clears old content while preserving replacement-modal behavior and outer-trigger focus. The independent visual pass prompted a smaller phone header rather than smaller main text.

## Execution limits

Local Chromium startup failed under the authoring host’s socket policy, including an approved escalation, and the provided cloud browser blocked loopback navigation. No policy was modified or bypassed. Browser evidence comes from GitHub’s runner, with full portable runs distinguished from hosted-origin runs. Test-only storage fault shims never enter the production bundle.

NOT_RUN: human participant usability study, screen-reader session, empirical assessment calibration, real-account/provider integration, production deployment. The product is authored local guided logic and an explicit synthetic comparison demo. No live LLM or therapeutic assessment is implemented.

The historical records below describe prior releases only.

# Verification record

**Latest patch: 0.2.1.** The license/brand revision passed 100 domain/package tests and 232 offline Chromium assertions locally; see [current status](STATUS.md) and [patch receipt](verification/0.2.1-local.json). The record below remains the historical 0.2.0 run. The subsequent GitHub served-origin patch run passed **238 browser assertions**; see [its receipt](verification/0.2.1-hosted.json). This was a runner-local HTTP origin, not a Vercel deployment.

**Executed locally on September 30, 2026 · Release 0.2.0**

## Baseline

The live predecessor was inspected at commit `02a8abe83cc4813bf978aab3498cee5c4ce047b3`. Local source recovery was checked against its Git blob identities. The original `npm run check` passed: 33 domain tests plus production/offline build. The original offline application was rendered and visually inspected in Chromium. Its original full browser smoke suite was not rerun.

## Comparative release

| Check actually executed | Result |
|---|---|
| Original domain regression suite | 33 passed, unchanged assertions |
| Added comparative engine suite | 57 passed |
| Complete domain total | **90 passed; 0 failed; 0 skipped** |
| Production build | Modular static site and portable HTML generated |
| Chromium browser suite | **203 assertions passed** |
| Browser version | Chromium `144.0.7559.96` |
| Runtime errors / external requests | None observed in the offline suite |

The browser suite uses the actual generated portable HTML via `page.set_content`, not a separate UI mock. It exercises the complete person-comparison → Surpass Project → pending demonstration → human acceptance → changed index/percentile → revocation path. It also checks cohort changes, mode separation, source withdrawal, practice adoption, selective exports, literal rendering of hostile text, native dialog keyboard traversal, focus return, methodology decomposition, reduced motion and low/high/partial/unknown fixtures.

Nine routes were checked at 320, 390, 768 and 1440 pixels. Desktop captures were also inspected at 1600 pixels. Initial index 597 and 48th percentile became 615 and 49th after acceptance; completion and pending evidence alone left the original placement unchanged. The exact unrounded index change is approximately 17.361 points.

The test-only fixture loader replaces initial state in its own offline document. No production debug API or assessment bypass is shipped.

## Defects repaired during verification

Keyboard traversal at a dynamically replaced modal boundary could leave the dialog; explicit wrapping and guarded focus restoration repaired it. Unknown labels could force narrow dimension columns wider than the mobile viewport; zero-minimum grid tracks and a distinct unknown-value layout repaired it. Unknown percentile/chart values no longer produce a zero-position marker or a zero-valued graph point. Percentile movement now uses the first compatible rank snapshot instead of an earlier snapshot with no valid reference.

One initial naming assertion mistook buttons inside closed native disclosure elements for visible unnamed controls. Inspection confirmed they were hidden; the check now queries actual accessible button roles rather than layout rectangles. The requirement that every exposed button have a name remains intact.

## Important limits

Navigating the installed browser to the local HTTP server returned `ERR_BLOCKED_BY_ADMINISTRATOR`. The browser policy was not modified or bypassed. Therefore this local run does **not** verify the hosted modular entry point, actual origin-localStorage reload behavior, served CSP enforcement or a Vercel deployment. `--url` mode is provided for an unrestricted local/CI environment and explicitly fails when navigation is blocked.

No screen-reader session, human usability study, empirical measurement calibration, real participant authorization, external provider integration or production security audit was performed. The local state validator is not authentication or protection against intentional local tampering.

## Reproduce

```bash
npm run check
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/browser_smoke.py --output qa-output

# Optional actual hosted-origin verification, in a separate terminal:
npm run preview
python tests/browser_smoke.py --url http://127.0.0.1:4173 --output qa-output-hosted
```

The machine-readable local result is `docs/verification/browser-results.json`. The CI workflow runs the hosted form as well and publishes its own run-specific result. A workflow definition or a green badge from another commit is not proof that the current commit has passed. Consult the actual GitHub run before claiming hosted/remote verification.

Deployment status is separate from source publication. This release includes Vercel configuration; no live deployment is asserted by this local record.
