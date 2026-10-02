# Becoming ChatGPT integration — continuation handoff

Review branch: `codex/becoming-chatgpt-app`, based on clean verified app baseline
`b044e6dffab10ed9ae62158e71203a36a3510ed2`. Requested publisher **Corgi-Verse Software**;
original author/copyright **Hayden Lindley**. The integration is locally implemented
and verified; live installation/publication is held for the owner. Read
[CONTRACT.md](CONTRACT.md), [ACCEPTANCE.md](ACCEPTANCE.md) and
[release evidence](docs/RELEASE.md) before changing scope.

## Delivered engineering

Real Streamable HTTP MCP tools and embedded widget, strict schemas/annotations/auth
metadata, external OAuth/OIDC JWT verification, PKCE/state/nonce account login,
encrypted durable SQLite records, human consent, revisions/retries, correctable
interest-led discovery, contradiction/uncertainty, attempts, export/validated restore,
erase/tombstones, separately authorized human evidence review, compatible real
participating-sample comparison and frozen concrete growth projects. The original
static/portable app, licenses, fixtures, storage and deployment path are preserved.
Normal runtime seeds no participants, reviewers or evidence; all test identities and
30-person comparison samples are explicitly synthetic fixtures in test files only.

**Unfinished code:** no required tool is a stub in the documented single-process,
JWT/OIDC slice. Public-profile adapters, calibration/population benchmarks, identity
proofing, opaque-token support, other client-auth methods, pairwise-sub mapping and
distributed storage are unavailable. If a chosen vendor needs those capabilities,
add/test the necessary adapter before claiming compatibility. Never scrape or
invent replacement statistics/participants.

**Live tests awaiting setup:** real ChatGPT app installation, host OAuth/scope step-up,
actual sandbox/CSP/bridge behavior, chosen real issuer/account, consented real evidence,
nonempty real references and backup deletion operations. Use
[docs/LIVE-TESTS.md](docs/LIVE-TESTS.md). Local widget tests substitute a visibly labeled
ChatGPT bridge and IdP while executing the real MCP/server/UI code; they are not live
ChatGPT proof. 152 original Node tests, both builds, 1,061 existing browser assertions,
11 integration Node tests and 23 integration browser assertions passed locally.

**Owner/manual account and authorization steps:**

1. Review the draft PR/source, particularly publisher rights in
   [docs/PUBLISHER.md](docs/PUBLISHER.md). Existing OpenAI-only licensing does not
   automatically grant independent Corgi-Verse hosting/distribution rights.
   Confirm the publisher relationship/grant without erasing earlier MIT rights.
2. Recheck current Apps SDK submission/publisher/brand/terms requirements that were
   blocked here. [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) pins checked official
   repository sources and records the developers.openai.com proxy 403. Never claim
   the inaccessible portal/terms were fully verified or accepted.
3. Choose/approve an OAuth/OIDC issuer with the supported token/client contract and
   stable cross-client subjects, account-web client, exact API audience/scopes,
   ChatGPT registration/callback and separately authorized reviewer subjects.
   Put credentials only in approved secret storage. Follow [INSTALL.md](INSTALL.md).
4. Approve publisher/account/domain identity, hosting/IdP costs and agreements,
   privacy/support contacts, region/age availability and actual backup deletion
   window. Then explicitly authorize the specific deployment/public exposure.
   None of these actions was performed by this build.
5. Run/record the real live test checklist; replace visibly labeled fixture listing
   captures with consented/redacted live screenshots. Recheck current asset specs.
6. Present exact release source and complete evidence for the owner's **personal
   publication approval**. Obtain approval before spending, accepting agreements,
   deploying or submitting. Technical success is not human publication acceptance.

## Reproduction and source receipts

```bash
# Existing static app, from repository root
npm run check
npm run preview
# Run the two browser runners with --url http://127.0.0.1:4173,
# then run both without --url for the portable build.

# Independent integration package (Node 24.13+)
cd plugins/becoming
npm ci --ignore-scripts
npm test
npm audit --omit=dev
npm run test:browser
```

Browser dependencies are the existing `tests/requirements.txt`. Current-head CI
publishes source-revision/tree files, receipts and screenshots for both packages.
The [local receipt](docs/verification/local-receipt.json) pins source hashes and
explicit fixture labels. Read the receipt's checkpoint/dirty-state fields; it does
not certify later source automatically. Existing app sources are compared to the
verified baseline; new images capture actual running UI. No workflow deploys.

## Short continuation prompt

> Continue Becoming’s ChatGPT integration from this draft branch. Read
> `plugins/becoming/HANDOFF.md`, its contract and release receipts; inspect Git/AGENTS
> and preserve the existing app. Finish approved real OAuth/ChatGPT setup and live
> acceptance, resolve Corgi-Verse publisher/license/privacy decisions, then bring
> exact-source evidence to my personal publication review. Do not spend, accept
> agreements, deploy or submit without my explicit approval.
