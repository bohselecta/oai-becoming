# Becoming ChatGPT pilot — current continuation handoff

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

Continue [draft PR #6](https://github.com/bohselecta/oai-becoming/pull/6), branch
`codex/becoming-chatgpt-app`, from the exact source in
[latest setup receipt](docs/verification/setup-receipt.json). The preceding
[continuation receipt](docs/verification/continuation-receipt.json) remains historical.
Original static/portable app baseline:
`b044e6dffab10ed9ae62158e71203a36a3510ed2`. Read Git/AGENTS,
[contract](CONTRACT.md), [acceptance](ACCEPTANCE.md) and [release](docs/RELEASE.md).

## Owner direction and selected operations

The owner explicitly permitted real setup, agreements, deployment and submission
without further explicit approval. This supersedes the previous handoff/build-only
holds. The current intended stopping point is **his personal test before submission
for general use**. Never infer an actual completed user test from broad permission.

Selected providers: **Auth0 + Render**. Owner-confirmed publisher:
**Corgi-Verse Software**, Hayden Lindley's DBA. Author/copyright remains Hayden.
[Specific publisher authorization](docs/PUBLISHER-GRANT.md) resolves service-hosting
rights while retaining the root license, earlier MIT rights and third-party notices.
Intended contact **hayden@corgi-verse.com** is pending mailbox activation/delivery.

Owner is logged into:

- [Auth0 tenant onboarding](https://manage.auth0.com/dashboard/us/dev-awuiql8cytawcdoh/guided-onboarding)
- [Auth0 applications](https://manage.auth0.com/dashboard/us/dev-awuiql8cytawcdoh/applications)
- [Render dashboard](https://dashboard.render.com/)

Those account browser sessions are not available through this cloud executor.
No Auth0/Render management identity, secrets or browser-control tool is attached.
The current network policy also blocks their HTTP domains. Do not bypass the proxy;
use supported environment configuration if adding access. Provider/API credentials
must enter approved secret storage, never chat/Git or logs. Git transport works;
the injected gh CLI authentication did not pass, so PR metadata uses the connected
GitHub tool instead. The owner has entered payment and reached Render’s blueprint review. His screenshot
shows Render parsed the preceding service configuration and six manual fields.
The update reduces first deployment to SETUP_MODE=true and a generated secret;
the owner subsequently reported **https://becoming-pilot.onrender.com**.
Readiness/running SHA are still unverified: direct health and Auth0 discovery probes
returned executor proxy CONNECT 403, not observed provider responses. Account client
ID, exact issuer and owner subject are still needed. See
[live setup status](docs/verification/live-setup.json); never mark real OAuth/host
acceptance PASS from a reported URL alone.

## Delivered continuation

- `render.yaml`: separate single-process Node 24.19.0 persistent-disk pilot,
  manual deploys, no test harness or reviewer identities, no Vercel changes.
  First deployment asks only for `SETUP_MODE=true`; Render generates `DATA_KEY_SECRET`
  and provides `RENDER_EXTERNAL_URL`. Setup mode has no database, accounts or MCP;
  `/health` explicitly reports setup-required. Set mode false after real OAuth
  configuration. Existing base64 DATA_KEY inputs remain compatible; never set both.
- `PILOT_MODE` + exact `PILOT_SUBJECTS`: signed but uninvited accounts cannot use
  MCP or log into account pages. Empty pilot allowlist fails startup. Previously
  issued account sessions cannot retain removed invitations/reviewer roles.
- `/health`: exposes Render's exact source SHA and invite-only status, no identities.
- `/legal`: includes the specific DBA publisher grant beside preserved licenses.
- `npm run preflight -- HTTPS_ORIGIN`: read-only exact-source HTTPS/OIDC/MCP check;
  optional approved secret-store bearer read, never logs private text/tokens. Public
  readiness does not certify real OAuth or the ChatGPT host.
- [SETUP-NOW.md](docs/SETUP-NOW.md): one linked guide for current account work,
  Auth0 Default Audience/PKCE/client settings, secret storage, service links,
  ChatGPT install/test, and remaining publication facts.
- Publisher/privacy/contract docs reconcile the newer authorization and selected DBA,
  contact/providers. Infrastructure retention and mailbox delivery remain explicit.

## External work remaining

1. Finish Auth0 real account/API/client setup using the linked guide. Verify exact
   issuer (including trailing slash), stable cross-client subject, `/mcp` audience,
   read/write scopes, RS256, S256 and one-hour tokens. Prefer pre-registration if
   the current host supports it; use only its actual shown callback URI.
2. Authorize Render's GitHub integration, parse/provision the blueprint, supply
   secrets only in Render and record actual HTTPS hostname/deployed source.
3. Run the exact-source preflight over permitted network access. Owner installs
   the app in [ChatGPT settings](https://chatgpt.com/#settings), signs in with the
   same real account and personally grants storage consent at `/account`.
4. Execute [LIVE-TESTS.md](docs/LIVE-TESTS.md). Initial real sample is empty and
   correctly unknown. A separate actual reviewer and consented real participants
   are needed for reviewed placement; 30 references only for aggregate percentile.
   Never seed test people to manufacture live proof.
5. Create/test the contact mailbox; review actual provider/OpenAI agreements and
   publisher verification; record actual snapshot/log retention and safe deletion/
   restore procedure. Do not claim an unobserved backup deletion window.
6. Bring exact source, live redacted screenshots and PASS/FAIL/NOT_RUN receipts
   to the owner's personal test/review. Keep general-use submission pending that
   requested test. Broad action permission does not establish host compatibility,
   agreement acceptance or completed publication.

## Verification

Historical draft CI passed exact source `9db3cb67df4b1faddc56a37afc221bb4a1305ace`:
[original app](https://github.com/bohselecta/oai-becoming/actions/runs/36945381892),
[integration](https://github.com/bohselecta/oai-becoming/actions/runs/36945381862).
Historical receipts pin earlier exact revisions and cannot certify this continuation.
Current-source tests/CI and hashes belong in the continuation receipt.

Reproduce: root `npm run check`, both browser runners portable and served, then
`cd plugins/becoming && npm ci --ignore-scripts && npm test && npm audit --omit=dev`
and `npm run test:browser`. The integration tests now include pilot denial, stale
session permission removal, source-bound preflight, actual setup-mode entrypoint
boundaries and stable generated-secret derivation. The preceding receipt covers
the earlier source; use the latest exact-head CI for this setup amendment. Fixture IdP/host
execution remains explicitly **not live ChatGPT acceptance**.

## October 3 finish pass

Independent review reproduced an in-flight account-write race: a consent form
started before erase could finish afterward and recreate storage consent. Account
POSTs now re-read session, invitation/reviewer authority and current state after
the streamed body completes, before any mutation. Regression tests cover erase,
logout, session expiry and consent withdrawal during import. This is fixture
security evidence, not a live-account test.

Read [operations and safe recovery](docs/OPERATIONS.md) before enabling real records.
[Live acceptance](docs/LIVE-TESTS.md) separates owner-only testing from optional
reviewer/comparison validation. The parent coordinates Mac-only account inspection.
The cloud network still blocks the reported Render origin with proxy CONNECT 403.
