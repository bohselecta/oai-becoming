/** TEST ONLY. Synthetic OAuth identities; never imported by runtime modules. */
import { createServer } from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createApp } from "../src/http.mjs";
export async function port() {
  const s = createServer();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  const p = s.address().port;
  await new Promise((r) => s.close(r));
  return p;
}
const sha = (s) => createHash("sha256").update(s).digest("base64url");
export async function fixture(overrides = {}) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = {
    ...(await exportJWK(publicKey)),
    kid: "fixture-key",
    alg: "RS256",
    use: "sig",
  };
  const codes = new Map();
  const registeredRedirects = new Set();
  let origin, appOrigin;
  const issue = async (subject, audience, claims = {}, options = {}) =>
    new SignJWT({ scope: "becoming:read becoming:write", ...claims })
      .setProtectedHeader({ alg: "RS256", kid: "fixture-key" })
      .setSubject(subject)
      .setIssuer(options.issuer ?? origin)
      .setAudience(audience)
      .setIssuedAt(options.iat ?? Math.floor(Date.now() / 1000))
      .setExpirationTime(options.exp ?? "1h")
      .sign(privateKey);
  const idp = createServer(async (req, res) => {
    const url = new URL(req.url, origin);
    res.setHeader("Content-Type", "application/json");
    if (
      url.pathname === "/.well-known/openid-configuration" ||
      url.pathname === "/.well-known/oauth-authorization-server"
    )
      return res.end(
        JSON.stringify({
          issuer: origin,
          jwks_uri: `${origin}/jwks`,
          authorization_endpoint: `${origin}/authorize`,
          token_endpoint: `${origin}/token`,
          registration_endpoint: `${origin}/register`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code"],
          token_endpoint_auth_methods_supported: ["none"],
          code_challenge_methods_supported: ["S256"],
          authorization_response_iss_parameter_supported: true,
        }),
      );
    if (url.pathname === "/jwks")
      return res.end(JSON.stringify({ keys: [jwk] }));
    if (url.pathname === "/register") {
      const raw = await read(req);
      const meta = JSON.parse(raw);
      if (
        !meta.redirect_uris?.every((u) => u.startsWith("http://127.0.0.1:"))
      ) {
        res.statusCode = 400;
        return res.end("{}");
      }
      for (const uri of meta.redirect_uris) registeredRedirects.add(uri);
      return res.end(
        JSON.stringify({ client_id: "fixture-mcp-client", ...meta }),
      );
    }
    if (url.pathname === "/authorize") {
      if (
        url.searchParams.get("code_challenge_method") !== "S256" ||
        (url.searchParams.get("redirect_uri") !==
          `${appOrigin}/auth/callback` &&
          !registeredRedirects.has(url.searchParams.get("redirect_uri")))
      ) {
        res.statusCode = 400;
        return res.end("{}");
      }
      const args = url.searchParams
        .toString()
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(
        `<!doctype html><title>TEST FIXTURE identity provider</title><h1>TEST FIXTURE — synthetic identities only</h1><form action="/approve" method="post"><input type="hidden" name="params" value="${args}"><label>Fixture identity<select name="subject"><option value="alice">FIXTURE Alice</option><option value="bob">FIXTURE Bob</option><option value="reviewer">FIXTURE Reviewer</option></select></label><button>Sign in as test fixture</button></form>`,
      );
    }
    if (url.pathname === "/approve") {
      const form = new URLSearchParams(await read(req)),
        args = new URLSearchParams(form.get("params"));
      const code = randomBytes(24).toString("hex");
      codes.set(code, { args, subject: form.get("subject") });
      const next = new URL(args.get("redirect_uri"));
      for (const [k, v] of Object.entries({
        state: args.get("state"),
        code,
        iss: origin,
      }))
        next.searchParams.set(k, v);
      res.statusCode = 303;
      res.setHeader("Location", next.href);
      return res.end();
    }
    if (url.pathname === "/token") {
      const form = new URLSearchParams(await read(req));
      const entry = codes.get(form.get("code"));
      codes.delete(form.get("code"));
      if (
        !entry ||
        form.get("redirect_uri") !== entry.args.get("redirect_uri") ||
        form.get("client_id") !== entry.args.get("client_id") ||
        (entry.args.has("resource") &&
          form.get("resource") !== entry.args.get("resource")) ||
        sha(form.get("code_verifier") || "") !==
          entry.args.get("code_challenge")
      ) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "invalid_grant" }));
      }
      return res.end(
        JSON.stringify({
          token_type: "Bearer",
          access_token: await issue(
            entry.subject,
            entry.args.get("resource") || appOrigin + "/mcp",
            { scope: entry.args.get("scope") || "becoming:read" },
          ),
          id_token: await issue(entry.subject, entry.args.get("client_id"), {
            nonce: entry.args.get("nonce"),
          }),
        }),
      );
    }
    res.statusCode = 404;
    res.end("{}");
  });
  await new Promise((r) => idp.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${idp.address().port}`;
  const dir = mkdtempSync(join(tmpdir(), "becoming-test-"));
  appOrigin = `http://127.0.0.1:${await port()}`;
  const config = {
    origin: appOrigin,
    issuer: origin,
    clientId: "fixture-account-web",
    dataKey: randomBytes(32).toString("base64"),
    database: join(dir, "records.sqlite"),
    reviewerSubjects: ["reviewer"],
    development: true,
    ...overrides,
  };
  let app = await createApp(config);
  await new Promise((r) =>
    app.server.listen(Number(new URL(appOrigin).port), "127.0.0.1", r),
  );
  const clients = [];
  async function client(
    subject,
    scope = "becoming:read becoming:write",
    token,
  ) {
    const c = new Client({
      name: "Becoming TEST FIXTURE harness",
      version: "1.0.0",
    });
    await c.connect(
      new StreamableHTTPClientTransport(new URL(appOrigin + "/mcp"), {
        requestInit:
          token === false
            ? {}
            : {
                headers: {
                  Authorization: `Bearer ${token || (await issue(subject, appOrigin + "/mcp", { scope }))}`,
                },
              },
      }),
    );
    clients.push(c);
    return c;
  }
  async function login(subject) {
    const start = await fetch(appOrigin + "/auth/login", {
      redirect: "manual",
    });
    const browserCookie = start.headers.get("set-cookie").split(";")[0];
    const authUrl = new URL(start.headers.get("location"));
    const approve = await fetch(origin + "/approve", {
      method: "POST",
      body: new URLSearchParams({
        params: authUrl.searchParams.toString(),
        subject,
      }),
      redirect: "manual",
    });
    const callback = await fetch(approve.headers.get("location"), {
      headers: { Cookie: browserCookie },
      redirect: "manual",
    });
    if (callback.status !== 303) throw new Error(await callback.text());
    const sessionCookie = callback.headers
      .getSetCookie()
      .find((c) => c.startsWith("becoming_session="))
      .split(";")[0];
    return { cookie: sessionCookie, subject };
  }
  async function account(session) {
    return (
      await fetch(appOrigin + "/account", {
        headers: { Cookie: session.cookie },
      })
    ).text();
  }
  function hidden(html, name) {
    return html.match(new RegExp(`name="${name}" value="([^"]+)"`))?.[1];
  }
  async function post(session, path, fields, html) {
    html ||= await account(session);
    return fetch(appOrigin + path, {
      method: "POST",
      headers: { Cookie: session.cookie, Origin: appOrigin },
      body: new URLSearchParams({
        csrf: hidden(html, "csrf"),
        revision: hidden(html, "revision"),
        requestId: hidden(html, "requestId"),
        ...fields,
      }),
      redirect: "manual",
    });
  }
  async function consent(
    session,
    compare = false,
    name = "FIXTURE " + session.subject,
  ) {
    const result = await post(session, "/account/consent", {
      storage: "on",
      ...(compare ? { compare: "on" } : {}),
      displayName: name,
    });
    if (result.status !== 303) throw new Error(await result.text());
  }
  return {
    get app() {
      return app;
    },
    config,
    dir,
    origin: appOrigin,
    idpOrigin: origin,
    issue,
    client,
    login,
    account,
    post,
    hidden,
    consent,
    async restart() {
      for (const c of clients) await c.close();
      await app.close();
      app = await createApp(config);
      await new Promise((r) =>
        app.server.listen(Number(new URL(appOrigin).port), "127.0.0.1", r),
      );
    },
    async close() {
      for (const c of clients) await c.close();
      await app.close();
      await new Promise((r) => idp.close(r));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
async function read(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString();
}
export async function tool(client, name, args = {}) {
  return client.callTool({ name, arguments: args });
}
