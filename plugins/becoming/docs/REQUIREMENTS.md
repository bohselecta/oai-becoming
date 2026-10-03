# Official requirements: verified sources and access limits

Checked October 1, 2026. The current official **OpenAI Apps SDK examples** at
[`18cc38e78a968712c357bacdc3c79fead5bfc6b4`](https://github.com/openai/openai-apps-sdk-examples/tree/18cc38e78a968712c357bacdc3c79fead5bfc6b4)
and official **MCP specification** repository at
[`3098fe94caa1b9e0afaaa6d30e040b61d5802471`](https://github.com/modelcontextprotocol/modelcontextprotocol/tree/3098fe94caa1b9e0afaaa6d30e040b61d5802471)
were fetched and read. These are primary sources, not third-party tutorials.
The selected current MCP authorization text is version **2026-07-28**. The installed
official TypeScript MCP SDK is **1.31.0** (npm registry current version when checked).
Transport protocol versions are negotiated by that SDK; the implementation does
not pretend to implement every newer spec feature independently of SDK support.

| Verified requirement | Primary source | Implementation/evidence |
|---|---|---|
| ChatGPT app exposes tools, executes calls and returns an inline component through MCP | [OpenAI overview](https://github.com/openai/openai-apps-sdk-examples/blob/18cc38e78a968712c357bacdc3c79fead5bfc6b4/README.md) | 11 strict tools, actual Streamable HTTP calls, widget resource |
| Rich tool responses contain structured content and template/UI metadata | [OpenAI Node example](https://github.com/openai/openai-apps-sdk-examples/blob/18cc38e78a968712c357bacdc3c79fead5bfc6b4/kitchen_sink_server_node/src/server.ts) | `_meta.ui.resourceUri`, `openai/outputTemplate`, `text/html+skybridge` HTML; compatibility bridge |
| Host bridge uses `toolOutput`, `callTool`, `openExternal` and globals updates | [Kitchen sink overview](https://github.com/openai/openai-apps-sdk-examples/blob/18cc38e78a968712c357bacdc3c79fead5bfc6b4/README.md#kitchen-sink-lite-overview) | Widget reads result, calls tools, opens first-party account page; no persistent private widget state |
| Protected tools declare OAuth security schemes; return authentication hints | [Official authenticated example](https://github.com/openai/openai-apps-sdk-examples/blob/18cc38e78a968712c357bacdc3c79fead5bfc6b4/authenticated_server_python/main.py) | Top-level/mirrored security schemes, HTTP `WWW-Authenticate`, tool `mcp/www_authenticate` |
| Protected-resource metadata must advertise authorization server(s) | [MCP authorization](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/3098fe94caa1b9e0afaaa6d30e040b61d5802471/docs/specification/2026-07-28/basic/authorization/index.mdx) | RFC 9728 discovery, exact resource audience, minimal initial read scope and step-up writes |
| OIDC issuer validation, PKCE S256, authorization response issuer check, audience binding; no token passthrough | [MCP security](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/3098fe94caa1b9e0afaaa6d30e040b61d5802471/docs/specification/2026-07-28/basic/authorization/security-considerations.mdx) | Account state/cookie binding, nonce, PKCE and response `iss`; signed resource tokens; negative tests |
| Current spec recommends client-ID metadata documents; pre-registration is supported; DCR deprecated compatibility option | [MCP client registration](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/3098fe94caa1b9e0afaaa6d30e040b61d5802471/docs/specification/2026-07-28/basic/authorization/client-registration.mdx) | Delegated to configured external authorization server; guide distinguishes current spec from older Auth0 sample |
| Developer-mode installation needs host-accessible endpoint | [Official testing instructions](https://github.com/openai/openai-apps-sdk-examples/blob/18cc38e78a968712c357bacdc3c79fead5bfc6b4/README.md#testing-in-chatgpt) | Manual guide prepared; no public exposure performed |

## Blocked primary documentation — do not claim fully verified

Direct HTTPS access to [developers.openai.com/apps-sdk](https://developers.openai.com/apps-sdk/)
returned proxy **403 Forbidden**. Network policy was not changed or bypassed.
Accordingly, the current web-only submission policy, exact publisher verification,
app-directory eligibility, image dimensions, UI resource sandbox domains and
current portal fields have **not** been independently verified in this session.
The official repository supports the code approach but does not replace those
publication documents. Do not treat this as a claim of full current approval.

The owner/next authorized agent must recheck:
[Apps SDK](https://developers.openai.com/apps-sdk/),
[auth guide](https://developers.openai.com/apps-sdk/build/auth),
[deployment guide](https://developers.openai.com/apps-sdk/deploy),
[submission guide](https://developers.openai.com/apps-sdk/app-submission-guidelines),
[OpenAI App Developer Terms](https://openai.com/policies/developer-apps-terms/) and
[brand guidance](https://openai.com/brand/).
These are verification destinations, not claims that every URL/page was accessible
or its current text was read. No terms were accepted.

Never follow the example README's suggestion to disable browser local-network
security flags. All tests here use permitted local origins and unchanged policies.
Public profile APIs are not implemented: profile statistics remain unavailable,
rather than scraping or substituting invented counts/people.

## Continuation source check — October 1, 2026 (America/Chicago)

The official OpenAI examples HEAD still resolves to
`18cc38e78a968712c357bacdc3c79fead5bfc6b4`. Its
[authenticated Auth0 setup](https://github.com/openai/openai-apps-sdk-examples/blob/18cc38e78a968712c357bacdc3c79fead5bfc6b4/authenticated_server_python/README.md)
was fetched and read again: an exact API identifier, Auth0 JWT profile/RS256 and
**tenant Default Audience** are needed to bridge MCP resource indicators and
Auth0's audience behavior. A dedicated tenant avoids changing other clients.
The example describes DCR; the pilot guide prefers pre-registration when the
actual ChatGPT account supports it. Neither route is claimed live-verified.

Direct requests to Apps SDK auth guidance, Render blueprint specification and
Auth0 access-token documentation returned proxy CONNECT **403** under the current
managed environment's enforced restricted policy. No policy was changed or bypassed.
The prepared Render blueprint is subject to validation in the owner's Render UI;
no current authenticated platform/terms/submission requirements have been verified.
The owner has now selected providers and granted action authority; this changes
permission, not access or verification evidence.
