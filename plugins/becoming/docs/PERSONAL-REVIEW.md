# Becoming — personal test and publication review

Review destination: [draft PR #6](https://github.com/bohselecta/oai-becoming/pull/6).
Exact tested implementation: `dc769250e074df33b259eebd4ded80cd891591d7`.
Source-bound evidence: [continuation receipt](verification/continuation-receipt.json).

The original static app's source, tests, fixtures, assets, storage keys, builds,
license and Vercel configuration match baseline `b044e6d` byte for byte. The
ChatGPT server remains a separate package. No local browser record is uploaded.

| Review item | Current evidence |
|---|---|
| Standalone product preserved | 152 Node tests, both builds, 1,061 browser assertions; exact-source CI passed. |
| MCP/account/widget implementation | 13 integration tests, 23 fixture browser assertions, actual official MCP HTTP client; exact-source CI passed; zero known npm audit findings. |
| Hosted owner-test access | Exact-subject pilot gate, no default identities/reviewer; retained sessions cannot keep removed roles; tested locally. |
| Source identity | `/health` reports Render commit; read-only preflight rejects a dirty checkout, wrong running commit or non-pilot service. |
| Publisher/license | Hayden's confirmed DBA Corgi-Verse Software; specific publisher authorization at `/legal`; root and MIT legacy notices preserved. |
| Contact/privacy | `hayden@corgi-verse.com` intended, activation/delivery pending; Auth0 + Render selected; infrastructure retention/restore deletion still unverified. |
| Actual deployment, provider agreements or charges | NOT_RUN; no real service URL/secret binding/account action available in the executor. |
| Real Auth0/ChatGPT OAuth and sandbox | NOT_RUN; fixture IdP/bridge explicitly cannot prove live acceptance. |
| Real reviewer/comparisons | NOT_RUN; initial empty sample is expected. No manufactured participants or public-profile statistics. |
| Publisher portal, live listing assets, general-use submission | NOT_RUN; your personal test precedes general-use submission. |

Start with [the linked account/setup guide](SETUP-NOW.md). You have already granted
authority for setup, deployment, agreements and submission. Current limits are
missing account access/facts and unperformed live tests, not an approval hold.

Once deployed, visit the actual `/account` link, grant storage consent yourself,
install via [ChatGPT settings](https://chatgpt.com/#settings), and walk through
save/return/uncertainty/correction/export/restore/withdraw/erase. Keep all public
assessment claims unavailable until the applicable real evidence/reviewer/sample
checks pass. Record real consented/redacted captures and the actual deployment SHA
against [LIVE-TESTS.md](LIVE-TESTS.md) before changing its NOT_RUN status.
