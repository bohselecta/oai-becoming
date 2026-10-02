# Becoming: get to your private ChatGPT test

Selected by Hayden Lindley on October 1, 2026: **Auth0 + Render**; publisher
**Corgi-Verse Software**, his DBA; intended contact **hayden@corgi-verse.com**.
The mailbox still needs to be created and tested. Deployment/agreement authority
is already given. This guide stops at your personal test before general-use submission.

**Current state:** verified source and deployment configuration, **not a deployed
app**. No real tenant, service URL, OAuth registration or ChatGPT installation is
recorded yet. This chat has no Auth0/Render credentials or browser session. Merely
logging into those sites does not transfer your session to this execution environment.
Do not paste passwords, client secrets or tokens into this chat.

## Open these in order

| Step | Link | What you do there |
|---|---|---|
| 1 | [Auth0 dashboard](https://manage.auth0.com/) | Create/select a dedicated pilot tenant; register the API, account-web client and invited owner. |
| 2 | [Render dashboard](https://dashboard.render.com/) | Authorize the Becoming GitHub repository and create the persistent pilot service from the blueprint below. |
| 3 | [ChatGPT settings](https://chatgpt.com/#settings) | Enable developer mode where your plan permits; create a custom app using the real HTTPS `/mcp` URL and OAuth. |
| Later | [OpenAI publisher dashboard](https://platform.openai.com/) | Verify the publisher and prepare the submission only after your test. Navigate to the current Apps submission area; this is not a claim that a listing exists. |

Only account registration/authorization and these account-owned settings require
manual work. No OpenAI API key is needed. You already authorized service costs;
Render's current displayed plan/disk price applies. No charge has occurred here.

## 1. Auth0: sign-in and exact token audience

Use a **dedicated tenant** so its default audience does not affect other apps.
In [Auth0](https://manage.auth0.com/), note the exact tenant HTTPS issuer, including
its trailing slash as reported by `/.well-known/openid-configuration`.

After Render reserves the service's actual hostname in step 2, use that origin
as `APP_ORIGIN` below. If you need to reserve the service first, it is safe for
its initial deploy to fail until its real configuration is supplied. Never replace
an unknown hostname with an invented production URL.

1. Applications → APIs → Create API: name **Becoming pilot**, identifier exactly
   **`APP_ORIGIN/mcp`**, Auth0 JWT profile, **RS256**, token expiry **3600 seconds**.
   Add permissions **`becoming:read`** and **`becoming:write`**. Keep RBAC permission
   intersection disabled unless you explicitly assign both permissions to the owner.
2. Tenant Settings → API Authorization Settings (current dashboard names may vary):
   set **Default Audience** to that exact API identifier. This is the documented
   Auth0 setup in the [official OpenAI authenticated example](https://github.com/openai/openai-apps-sdk-examples/blob/18cc38e78a968712c357bacdc3c79fead5bfc6b4/authenticated_server_python/README.md).
   Auth0's vendor `audience` parameter must not be confused with MCP's `resource`
   parameter. This default binds the issued access token to the required audience;
   Becoming still rejects every wrong audience. Do not substitute opaque tokens.
3. Applications → Create Application: **Becoming account**, Regular Web Application.
   Enable Authorization Code, **PKCE S256**, and token endpoint authentication
   **`client_secret_post`**. Callback: **`APP_ORIGIN/auth/callback`** only. Preserve
   the Client ID and secret in Render Environment, never in Git or this chat.
4. Authentication → Database: enable a connection on that application and disable
   public signups for the pilot. User Management → Users: create your real user and
   copy its exact **`user_id`** to Render's **`PILOT_SUBJECTS`**. Social login is
   optional; use the same connection/person in both clients. Do not match by email
   or create a second identity for the ChatGPT client. The app enforces an invitation
   even if a connection accidentally permits signup.
5. For ChatGPT, prefer a separate pre-registered **Becoming ChatGPT** client when
   the current custom-app dialog supports client ID/secret. Enable Authorization
   Code + S256, `client_secret_post` as supported by that dialog, the same connection,
   and the API read/write scopes. Copy **only the exact callback URI shown by
   ChatGPT or its current official guide** into Auth0's Allowed Callback URLs.
   This guide deliberately does not guess that account-specific callback.
   Keep automatic third-party client consent skipping disabled.
6. If your ChatGPT dialog only supports dynamic registration, verify current host
   support and Auth0 OIDC Dynamic Application Registration requirements first.
   Use [current OpenAI auth guidance](https://developers.openai.com/apps-sdk/build/auth)
   and the official example above. Do not enable tenant-wide DCR or domain-wide
   connections as a substitute for checking the actual host flow.

The server's account-web client supports `none` or `client_secret_post`, not
`client_secret_basic` or private-key JWT. Access tokens must contain the exact
issuer, stable `sub`, exact API audience and space-separated `scope`. Discovery
must advertise S256. An account ID token and a resource access token have different
audiences; never use the ID token as an MCP token.

## 2. Render: one service, one persistent disk

Open [Render's blueprint creation screen](https://dashboard.render.com/select-repo?type=blueprint)
and authorize [this repository](https://github.com/bohselecta/oai-becoming) through
Render's GitHub connection. If that screen changes, Dashboard → New → Blueprint
is the equivalent path.

Select branch **`codex/becoming-chatgpt-app`**, Blueprint Path
**`plugins/becoming/render.yaml`**. The blueprint is at
[this source link](https://github.com/bohselecta/oai-becoming/blob/codex/becoming-chatgpt-app/plugins/becoming/render.yaml).
It provisions a single native Node 24.19.0 Starter web service in Oregon with a
1 GiB private persistent disk at `/var/data`; it does not alter the Vercel demo.
Automatic deployment is off. Check Render's displayed price and parsed settings.
The blueprint has been parsed locally, not validated by an authenticated Render account.

Set these values in **Render → service → Environment**:

| Variable | Value |
|---|---|
| `APP_ORIGIN` | Actual reserved Render HTTPS origin, no trailing slash/path |
| `OIDC_ISSUER` | Exact Auth0 discovery issuer, usually with trailing slash |
| `OIDC_CLIENT_ID` | Becoming account-web Client ID |
| `OIDC_CLIENT_SECRET` | Account-web secret; protected Render environment value |
| `DATA_KEY` | Random 32 bytes as base64; generate with `openssl rand -base64 32` in your own terminal and paste only in Render |
| `PILOT_SUBJECTS` | Your exact Auth0 `user_id`; comma-separated only if inviting another real participant |

The blueprint supplies production mode, `BIND_ADDRESS=0.0.0.0`, the persistent
SQLite path and **`PILOT_MODE=true`**. Leave `REVIEWER_SUBJECTS` absent until you
invite a separate human reviewer; you cannot accept your own demonstrations.
Incoming origins default to the exact app origin and `https://chatgpt.com`.
Additional Auth0 endpoint origins must be explicitly trusted if discovery uses
other origins. Never add wildcard or `null` origin permissions.

Deploy the exact commit recorded in the continuation receipt. Render provides
`RENDER_GIT_COMMIT`; `/health` exposes that SHA so readiness can compare the running
service with the reviewed source. Keep the encryption key stable across restart.
Do not scale SQLite to multiple processes or move it to an ephemeral filesystem.

After deploy, these are your real service links (replace `APP_ORIGIN`):

- **`APP_ORIGIN/health`** — health, exact source SHA and invite-only status
- **`APP_ORIGIN/account`** — sign in and explicitly grant storage consent
- **`APP_ORIGIN/privacy`** — pilot disclosures and contact status
- **`APP_ORIGIN/legal`** — unchanged licenses and the specific DBA publisher grant
- **`APP_ORIGIN/mcp`** — paste this in ChatGPT; opening in a browser is not a widget test
- **`APP_ORIGIN/review`** — separately authorized real reviewer, when invited

From a checkout of that exact source, run:

```bash
cd plugins/becoming
npm ci --ignore-scripts
npm run preflight -- https://ACTUAL-SERVICE-HOST
```

The command saves a source-bound receipt in ignored `qa-output/live-preflight.json`.
It checks HTTPS, exact running SHA, pilot mode, OAuth discovery, S256 and the actual
11-tool MCP/widget descriptors. It makes no writes and does not certify ChatGPT.
An optional `BECOMING_ACCEPTANCE_TOKEN` supplied through your own approved secret
store can check a real consented read; private text/tokens are never printed.
Do not paste a token into a command that will enter shell history or into chat.

## 3. ChatGPT: your first personal test

At [ChatGPT settings](https://chatgpt.com/#settings), enable developer mode under
the current Apps/Advanced settings where supported by your plan/workspace. Create
**Becoming**, paste the real HTTPS `/mcp` endpoint, choose OAuth, and use the separate
client registration configured above. Your workspace may need its administrator
to enable custom apps. These settings are not a general-use directory submission.

Connect using the **same real Auth0 account**, visit the service `/account` and
check storage consent yourself. Keep comparison consent off for the first test.
In a chat, select Becoming and try:

> Open Becoming. Ask me about one interest and help me choose a small step.
> Ask before saving anything. Do not infer an assessment or skill score.

Save an interest/example/step, return in a new chat, inspect the saved record,
record an uncertain outcome and correct the example. Confirm that old action
confirmations clear. Placement should be unknown with an empty real sample.
Test export/confirmed restore, storage withdrawal and explicit erase in the account
page. A pending demonstration must remain unscored. General-use submission stays
pending your personal test and the full [live acceptance checklist](LIVE-TESTS.md).

## What to return here

Return only non-secret details: **Auth0 issuer, account-web Client ID, your Auth0
`user_id`, actual Render service URL, and whether ChatGPT accepts the OAuth registration**.
No passwords, secrets or bearer tokens. If you can connect an approved provider
management identity to this environment, setup can be performed through that
identity; browser login alone does not grant tool access.

## Publication readiness that is still pending

Create/test [hayden@corgi-verse.com](mailto:hayden@corgi-verse.com), verify the DBA
name in the publisher account, and inspect the actual platform terms. Current
[OpenAI App Developer Terms](https://openai.com/policies/developer-apps-terms/),
[submission guidance](https://developers.openai.com/apps-sdk/app-submission-guidelines),
[Auth0 legal terms](https://auth0.com/legal) and [Render terms](https://render.com/terms)
are manual verification links; they were not accessible/accepted here.

The pilot uses no operator-created backups. Render-managed disk snapshots, Auth0
and infrastructure log retention must be checked in those accounts and recorded
before any general-use retention promise. Test erase on active storage and the
actual snapshot expiry/deletion procedure; do not restore a snapshot that resurrects
erased records. Public release also needs genuine reviewer operations, live redacted
screenshots and portal asset requirements. An empty sample is correct for your
initial test; 30 real references are needed only to claim an aggregate percentile.
