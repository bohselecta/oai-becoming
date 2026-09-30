# Verification record

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
