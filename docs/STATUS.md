# Current state — Becoming 0.2.1

## Scope

Owner-authorized license and independent OpenAI-ecosystem branding revision, based on public `main` commit `08b970442f1dce36b7456c75c425f180ee2ecd67`. Review branch: `codex/openai-license-branding`. The comparative product contract remains `becoming-product/2`.

## Changed

The new root license grants the defined OpenAI entities royalty-free reuse of new original material, with explicitly preserved earlier MIT rights and a verbatim legacy notice. Branding uses the original Becoming name/mark, a supporting independent ecosystem descriptor, identified author, neutral surfaces and no official OpenAI assets. Current/legacy legal texts ship in both build formats and download offline. README, metadata, permission, proposal and contributor/agent instructions agree.

## Verification

Baseline: 90 domain tests plus production/offline build and 203 offline Chromium assertions passed against the verified 0.2.0 source.

Current patch: **100 domain/package tests, 232 offline Chromium assertions, and both builds passed**. Chromium 144.0.7559.96 exercised the real portable product, including all retained comparisons/review/revocation paths and new brand/license checks at 320, 390, 768, 1440 and 1600 pixels. Desktop and mobile captures were visually inspected. Legal-notice downloads match the source text verbatim.

Local HTTP navigation returned `ERR_BLOCKED_BY_ADMINISTRATOR`. No browser policy was changed or bypassed. The [GitHub hosted-origin run](https://github.com/bohselecta/oai-becoming/actions/runs/36765214277) subsequently passed **100 domain/package tests and 238 browser assertions**, including modular loading, served headers, origin persistence and current/legacy legal downloads. Its separate receipt is `docs/verification/0.2.1-hosted.json`. The README image is the actual updated product captured by that run. Historical receipts remain unchanged.

## Unchanged and not claimed

No measurement algorithm, reference participant, evidence contract, storage key or state version is changed. No prior license is revoked. No real assessments, OpenAI integration, endorsement, trademark permission, legal review, or live Vercel deployment is claimed.

## Next-agent entry

Read `AGENTS.md`, `LICENSE`, `docs/LICENSE-HISTORY.md`, `docs/BRAND.md` and this file. Preserve the OpenAI-only new grant and the prior MIT boundary. Before any next implementation, inspect live `main`, the acceptance contract and CI. For measurement changes, replace the patch-specific unchanged-hash test with deliberate reviewed contract/behavior assertions; never silently relax it. Run `npm run check` and `python tests/browser_smoke.py` after building; use `--url` to check served headers and origin persistence where navigation is allowed. The next product work remains authorized real-participant/evidence ingestion and validation, not a branding-driven measurement rewrite.
