# Installation and setup

**Current continuation:** Auth0 + Render is selected and deployment authority is
already given. Start with [SETUP-NOW.md](docs/SETUP-NOW.md) for direct account links,
the persistent Render blueprint and exact Auth0 settings. Historical approval holds
below describe the original build phase and are superseded by the contract amendment.

## 1. Review source without credentials

Read [CONTRACT.md](CONTRACT.md), [docs/RELEASE.md](docs/RELEASE.md) and
[docs/PUBLISHER.md](docs/PUBLISHER.md). Run the existing app independently at the
repo root with `npm run check` and `npm run preview` (Node 22+).

For this separate integration, install Node 24.13+ and run:

```bash
cd plugins/becoming
npm ci --ignore-scripts
npm test
npm run test:browser
```

The browser suite requires `python -m pip install -r ../../tests/requirements.txt`
and `python -m playwright install chromium`. It will use an existing system
Chromium when available; it never changes browser/network policy. It launches and
cleans up its own loopback fixture servers. Never expose the test harness or IdP
publicly. Tests contain synthetic subjects and disclose them visibly.

## 2. Manual authorization-server/account setup

**Do this only after the owner's review and any required approval for cost/terms.**
Choose an owner-approved OAuth/OIDC authorization server. The app is a resource
server, not an identity service. No vendor account has been created or agreement
accepted. Requirements checked against current primary sources are in
[REQUIREMENTS.md](docs/REQUIREMENTS.md).

- Use an HTTPS issuer with OIDC discovery, `jwks_uri`, authorization and token
  endpoints and advertised **PKCE S256**. Tokens must use RS256 or ES256 and include
  `iss`, `sub`, `iat`, `exp` and space-separated `scope` claims. Access tokens may
  be valid for at most one hour; opaque tokens/introspection are not supported.
- Register the API resource audience as **exactly `APP_ORIGIN/mcp`**. Configure
  resource indicators on authorization/token requests to issue that audience;
  do not rely on accepting arbitrary/default audiences. Configure `becoming:read`
  and `becoming:write` scopes, with read as the initial minimum. Write tools need
  both because they return the current record. Configure refresh rotation/revocation
  in the provider if it offers refresh tokens to ChatGPT.
- For ChatGPT client registration, use current host-supported client-ID metadata
  documents or pre-registration. DCR remains a compatibility fallback in the
  current MCP spec; it is not a universal new-server requirement. Confirm the
  exact current ChatGPT flow in your account. Never invent a ChatGPT redirect URI.
  Register only the exact callback URI shown by the host/official guide.
- Register a separate account-web OIDC client, redirect URI **`APP_ORIGIN/auth/callback`**,
  using authorization code with S256 and `openid`. A public client with token
  endpoint auth `none`, or confidential `client_secret_post`, is supported by this
  implementation. Providers that require another client-auth method need an
  explicit adapter before use; no promise is made for every OIDC vendor.
- Ensure the same person has the **same stable `sub` in the MCP and account-web
  clients**. Pairwise identifiers that differ between those clients must be
  configured into a common approved sector or resolved by an explicit identity
  mapping implementation before release. Do not map by email/display name.
- Choose separately authorized human reviewers and put their exact issuer
  subjects in `REVIEWER_SUBJECTS`. They cannot review their own observations.
  This is an operator-managed allowlist, not a model tool or a default test user.

## 3. Configure the server locally

Copy `.env.example` to `.env` (ignored by Git) and replace every placeholder.
Generate a 32-byte random base64 `DATA_KEY`, protect it as a deployment secret,
and set `DATABASE_PATH` to a durable private volume. Keep the key with secured
backups; losing it makes existing records unreadable. Do not casually rotate the
key: it also derives opaque account IDs, so rotation requires a planned migration.
No OpenAI API key is needed.

`APP_ORIGIN` is a canonical HTTPS origin without a trailing slash or path.
`OIDC_ISSUER` must exactly match discovery metadata. OIDC endpoints are restricted
to `OIDC_TRUSTED_ORIGINS`; add only explicitly trusted provider origins if its
JWKS or token endpoint lives elsewhere. `ALLOWED_ORIGINS` controls incoming
browser origins; include only observed/approved ChatGPT origins and the app origin.
Do not add `null` or `*` to make a browser pass.

```bash
npm start
```

Startup fails closed if OIDC discovery, PKCE support, key or URL configuration is
missing. Account actions are at `/account`; authorized human reviewers use
`/review`; Streamable HTTP MCP is at `/mcp`; protected-resource discovery is at
`/.well-known/oauth-protected-resource/mcp`. `/health` reveals no personal data.

For private local development only, `NODE_ENV=development` requires both app and
issuer to be HTTP loopback origins. This enables non-Secure loopback cookies;
it cannot run against public origins. Production requires HTTPS and Secure cookies.
The fixture IdP exists only in tests and is never loaded by `npm start`.

## 4. Hosting plan — prepared, not deployed

An HTTPS reverse proxy should route to the configured bind address, preserve the
canonical Host header and redact Authorization, Cookie, callback query strings,
private bodies and exports from logs. Do not log tokens. Configure limits and TLS,
monitor health and errors without private content, and test restoration on a
throwaway volume. The current server supports one process and one durable volume;
SQLite is not an ephemeral/serverless persistence solution. Distributed replicas
need a separately designed database migration. The original root `vercel.json`
continues to serve only the static demo; it does not host this backend.

Before provisioning, approve hosting cost, agreements, domain, license and privacy
contacts/backup deletion window. No tunnel, public preview, deployment or external
provider account has been created by this task. Public exposure is deployment and
requires the owner's approval, even if a tunnel is offered without charge.

## 5. Live ChatGPT installation — awaiting approved setup

Recheck the current Apps SDK guide and your ChatGPT plan/workspace permissions.
Enable developer mode where supported, create a custom app/connector in ChatGPT
settings and enter the approved **HTTPS `/mcp` endpoint**. Select OAuth and provide
any pre-registered client settings the host requires. A legacy `ai-plugin.json`,
Codex plugin bundle or paid OpenAI API key is not the installation mechanism.
Names/menu locations may differ by current ChatGPT account.

Run [LIVE-TESTS.md](docs/LIVE-TESTS.md) using real accounts, initially with an empty
reference sample. Record exact source, deployment and OAuth issuer. Use genuine,
consenting participants if testing nonempty comparisons. Never import the test
fixture participants into a live service. App-directory listing/submission is a
later, separate owner-approved step after live tests and publication review.
