import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Store, AppError, requireThat, secret } from "./store.mjs";
import { createAuth, validateConfig } from "./auth.mjs";
import { buildMcp } from "./tools.mjs";
import { exportJourney, parseJourneyBackup } from "../../../src/journey.js";
import {
  reviewEvidence,
  MARKS,
  RUBRIC,
  PROTOCOL,
  MEASUREMENT_NOTICE,
} from "./measurement.mjs";

export const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const esc = escapeHtml;
const cookie = (req, name) =>
  req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`))
    ?.slice(name.length + 1);
async function body(req, limit = 2_000_000) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    requireThat(bytes <= limit, "BODY_TOO_LARGE", "Request is too large.", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
const headerInputs = (session, state) =>
  `<input type="hidden" name="csrf" value="${esc(session.csrf)}"><input type="hidden" name="revision" value="${state.revision}"><input type="hidden" name="requestId" value="${secret()}">`;
function shell(title, html, nonce) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)} · Becoming</title><style nonce="${nonce}">:root{font:17px system-ui;color:#173b32;background:#f8f9f6}body{max-width:760px;margin:3rem auto;padding:0 1rem;line-height:1.6}a{color:#173b32}h1,h2{line-height:1.15}label{display:block;margin:1rem 0}textarea,input:not([type=checkbox]):not([type=hidden]),select{box-sizing:border-box;display:block;width:100%;padding:.7rem;font:inherit;border:1px solid #87978f;border-radius:8px}button{background:#173b32;color:white;padding:.75rem 1rem;font:inherit;border:0;border-radius:8px;cursor:pointer;margin:.5rem .5rem .5rem 0}section{border-top:1px solid #d6ded8;padding:1rem 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}small{display:block}*:focus-visible{outline:3px solid #668834;outline-offset:3px}</style><header><strong>Becoming</strong><p>By Corgi-Verse Software · Created by Hayden Lindley<br>Independent integration intended for ChatGPT. No OpenAI affiliation or endorsement.</p></header><main><h1>${esc(title)}</h1>${html}</main><footer><a href="/privacy">Data & privacy</a> · <a href="/legal">Licenses</a></footer></html>`;
}
export async function createApp(input) {
  const config = validateConfig({ ...input });
  const store = new Store(config.database, config.dataKey);
  let auth;
  try {
    auth = await createAuth(config, store);
  } catch (error) {
    store.close();
    throw error;
  }
  const rate = new Map();
  const server = createServer(async (req, res) => {
    const nonce = secret();
    const render = (title, html, status = 200) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(shell(title, html, nonce));
    };
    const json = (value, status = 200) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(value));
    };
    const redirect = (path) => {
      res.statusCode = 303;
      res.setHeader("Location", path);
      res.end();
    };
    const setCookie = (name, value, ttl) =>
      `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}${config.development ? "" : "; Secure"}`;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; style-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
    );
    try {
      requireThat(
        req.headers.host === new URL(config.origin).host,
        "HOST_FORBIDDEN",
        "Unexpected Host header.",
        403,
      );
      if (req.headers.origin)
        requireThat(
          config.allowedOrigins.includes(req.headers.origin),
          "ORIGIN_FORBIDDEN",
          "Origin is not allowed.",
          403,
        );
      const ip = req.socket.remoteAddress;
      const minute = Math.floor(Date.now() / 60000);
      const entry = rate.get(ip);
      const current = entry?.minute === minute ? entry : { minute, n: 0 };
      current.n++;
      rate.set(ip, current);
      if (rate.size > 10000)
        for (const [key, value] of rate)
          if (value.minute !== minute) rate.delete(key);
      requireThat(
        current.n <= 120,
        "RATE_LIMIT",
        "Too many requests. Try again in a minute.",
        429,
      );
      const url = new URL(req.url, config.origin);
      if (
        url.pathname === "/.well-known/oauth-protected-resource/mcp" ||
        url.pathname === "/.well-known/oauth-protected-resource"
      ) {
        requireThat(req.method === "GET", "METHOD", "Use GET.", 405);
        return json({
          resource: config.resource,
          authorization_servers: [config.issuer],
          scopes_supported: ["becoming:read"],
          bearer_methods_supported: ["header"],
          resource_name: "Becoming",
        });
      }
      if (url.pathname === "/health")
        return json({ status: "ok", app: "Becoming", version: "0.1.0" });
      if (url.pathname === "/mcp") {
        requireThat(
          ["POST", "GET", "DELETE"].includes(req.method),
          "METHOD",
          "Unsupported MCP method.",
          405,
        );
        let actor = null;
        if (req.headers.authorization) {
          try {
            actor = await auth.bearer(req.headers.authorization);
          } catch (error) {
            res.setHeader(
              "WWW-Authenticate",
              auth.challenge(["becoming:read"], "invalid_token"),
            );
            return json({ error: error.code || "AUTH_INVALID" }, 401);
          }
        }
        // Discovery and widget resources are public and contain no personal data.
        // Private tool calls enforce token + scope + human consent independently.
        const mcp = buildMcp({ store, config, auth, actor });
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        await mcp.connect(transport);
        let parsed;
        if (req.method === "POST") {
          requireThat(
            req.headers["content-type"]?.startsWith("application/json"),
            "CONTENT_TYPE",
            "Use application/json.",
            415,
          );
          try {
            parsed = JSON.parse(await body(req, 65536));
          } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("INVALID_JSON", "Invalid JSON.");
          }
          if (parsed.method === "tools/call" && !actor) {
            res.setHeader(
              "WWW-Authenticate",
              auth.challenge(["becoming:read"]),
            );
            await transport.close();
            await mcp.close();
            return json({ error: "AUTH_REQUIRED" }, 401);
          }
        }
        res.on("close", () => {
          void transport.close();
          void mcp.close();
        });
        await transport.handleRequest(req, res, parsed);
        return;
      }
      if (url.pathname === "/privacy" && req.method === "GET")
        return render(
          "Data & privacy",
          `<pre>${esc(readFileSync(new URL("../docs/PRIVACY.md", import.meta.url), "utf8"))}</pre>`,
        );
      if (url.pathname === "/legal" && req.method === "GET")
        return render(
          "Licenses",
          `<pre>${esc(readFileSync(new URL("../../../LICENSE", import.meta.url), "utf8"))}</pre><pre>${esc(readFileSync(new URL("../../../licenses/MIT-legacy.txt", import.meta.url), "utf8"))}</pre>`,
        );
      if (url.pathname === "/auth/login" && req.method === "GET") {
        const login = auth.startLogin();
        res.setHeader(
          "Set-Cookie",
          setCookie("becoming_login", login.state, 600),
        );
        return redirect(login.url);
      }
      if (url.pathname === "/auth/callback" && req.method === "GET") {
        const token = await auth.callback(url, cookie(req, "becoming_login"));
        store.removeTransient("session", cookie(req, "becoming_session"));
        res.setHeader("Set-Cookie", [
          setCookie("becoming_session", token, 3600),
          setCookie("becoming_login", "", 0),
        ]);
        return redirect("/account");
      }
      const sessionToken = cookie(req, "becoming_session");
      const session = store.transient("session", sessionToken);
      if (!session) {
        if (
          req.method === "GET" &&
          ["/", "/account", "/review"].includes(url.pathname)
        )
          return render(
            "Your account",
            `<p>Choose what Becoming may retain before using private tools. Sign in through the configured identity provider.</p><p><a href="/auth/login">Sign in</a></p><p>No browser-local record is uploaded automatically.</p>`,
          );
        throw new AppError(
          "SESSION_REQUIRED",
          "Sign in to your account first.",
          401,
        );
      }
      const state = store.read(session.id);
      if (req.method === "GET" && ["/", "/account"].includes(url.pathname)) {
        const fields = headerInputs(session, state);
        return render(
          "Your data, your choice",
          `
          <p>Storage consent allows Becoming to retain your selected interests, examples, actions, constraints, reflections, submitted evidence and projects. The ChatGPT host sees tool inputs and outputs. Authorized human reviewers can inspect demonstrations you explicitly submit. Nothing here is a validated aptitude assessment.</p>
          <form method="post" action="/account/consent">${fields}
          <label><input type="checkbox" name="storage" ${state.consent.storage ? "checked" : ""}> Allow Becoming to retain and use my private record and submitted evidence</label>
          <label><input type="checkbox" name="compare" ${state.consent.compare ? "checked" : ""}> Allow my chosen name and compatible reviewed observations to appear to other opted-in participants in comparison tools</label>
          <label>Participant-chosen display name (required for comparison; authenticated account, not verified legal identity)<input name="displayName" maxlength="80" value="${esc(state.consent.displayName)}"></label>
          <button>Save consent choices</button></form>
          <p>Withdrawing storage consent blocks private reads/writes and excludes all observations. It retains the encrypted record until you explicitly erase it. Withdrawing comparison consent removes you from new comparisons and invalidates person-target project status. Copies already seen in chats or exports cannot be recalled.</p>
          <section><h2>Inspect and export</h2><p>Revision ${state.revision}. ${state.evidence.length} submitted evidence accounts. ${state.projects.length} projects.</p><details><summary>Inspect my saved record and evidence</summary><pre>${esc(JSON.stringify({ record: state.journey, evidence: state.evidence, projects: state.projects }, null, 2))}</pre></details><p><a href="/account/export">Download my complete private export</a></p></section>
          <section><h2>Restore your discovery record</h2><p>Paste a Becoming local backup or complete account export. This replaces only the discovery record after confirmation. Exported assessment marks and projects are never imported as accepted evidence. Your browser-local record must be exported manually first.</p><form method="post" action="/account/import">${fields}<label>Backup JSON<textarea name="backup" rows="5" maxlength="2000000" required></textarea></label><label><input type="checkbox" name="confirm" required> Replace my current discovery record with this validated backup</label><button>Validate and restore</button></form></section>
          <section><h2>Erase this Becoming account</h2><p>Removes the retained record, evidence, projects and consent; invalidates all Becoming sessions and pre-erasure authorizations. A minimal opaque tombstone prevents old tokens resurrecting data. ChatGPT history, identity-provider records and downloaded copies must be deleted separately.</p><form method="post" action="/account/erase">${fields}<label>Type ERASE<input name="confirmation" required autocomplete="off"></label><button>Erase my Becoming data</button></form></section>
          ${session.reviewer ? '<p><a href="/review">Human reviewer workspace</a></p>' : ""}
          <form method="post" action="/account/logout">${fields}<button>Sign out of Becoming</button></form>`,
        );
      }
      if (req.method === "GET" && url.pathname === "/account/export") {
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="becoming-private-export.json"',
        );
        return json({
          format: "becoming-account-export/1",
          exportedAt: new Date().toISOString(),
          journeyBackup: exportJourney(state.journey),
          evidence: state.evidence,
          projects: state.projects,
          consent: state.consent,
          notice:
            "Includes private text. Restoring imports only the discovery record, never reviewer assessments. Downloaded copies and ChatGPT history are outside Becoming deletion control.",
        });
      }
      if (req.method === "GET" && url.pathname === "/review") {
        requireThat(
          session.reviewer,
          "REVIEW_FORBIDDEN",
          "This account is not an authorized reviewer.",
          403,
        );
        const pending = store
          .all()
          .filter((p) => p.id !== session.id && p.state.consent.storage)
          .flatMap((p) =>
            p.state.evidence
              .filter((e) => e.status === "pending")
              .map((e) => ({ owner: p.id, state: p.state, e })),
          );
        return render(
          "Review actual demonstrations",
          `<p>${esc(MEASUREMENT_NOTICE)}</p><p>Inspect the actual work and recorded conditions before accepting. User accounts alone are not observed performance. No self-review. Rubric ${RUBRIC}, protocol ${PROTOCOL}.</p><pre>${esc(MARKS.join("\n"))}</pre>${pending.map(({ owner, state: s, e }) => `<section><h2>${esc(e.title)}</h2><pre>${esc(JSON.stringify(e, null, 2))}</pre><form method="post" action="/review/decision">${headerInputs(session, s)}<input type="hidden" name="owner" value="${owner}"><input type="hidden" name="evidenceId" value="${e.id}"><label>Decision<select name="decision"><option value="rejected">Reject</option><option value="accepted">Accept</option></select></label><label>Mark<input type="number" name="mark" min="0" max="4" required></label><label>Inspection and rationale<textarea name="rationale" required minlength="10" maxlength="1500"></textarea></label><label><input type="checkbox" name="inspected" required> I inspected the actual demonstration against the documented criterion and assistance conditions</label><button>Record my review</button></form></section>`).join("") || "<p>No pending demonstrations.</p>"}`,
        );
      }
      requireThat(req.method === "POST", "NOT_FOUND", "Page not found.", 404);
      requireThat(
        req.headers.origin === config.origin,
        "CSRF_ORIGIN",
        "Account writes require the same origin.",
        403,
      );
      requireThat(
        req.headers["content-type"]?.startsWith(
          "application/x-www-form-urlencoded",
        ),
        "CONTENT_TYPE",
        "Use a form submission.",
        415,
      );
      const form = new URLSearchParams(await body(req));
      requireThat(
        form.get("csrf") === session.csrf,
        "CSRF",
        "The form expired. Reload before saving.",
        403,
      );
      requireThat(
        /^[\w-]{8,100}$/.test(form.get("requestId") || ""),
        "REQUEST_ID",
        "Invalid request identifier.",
      );
      const expectedRevision = Number(form.get("revision"));
      requireThat(
        Number.isSafeInteger(expectedRevision) && expectedRevision >= 0,
        "REVISION",
        "Invalid revision.",
      );
      if (url.pathname === "/account/logout") {
        store.removeTransient("session", sessionToken);
        res.setHeader("Set-Cookie", setCookie("becoming_session", "", 0));
        return redirect("/account");
      }
      if (url.pathname === "/account/erase") {
        requireThat(
          form.get("confirmation") === "ERASE",
          "ERASE_CONFIRMATION",
          "Type ERASE to confirm.",
        );
        requireThat(
          expectedRevision === state.revision,
          "STALE_REVISION",
          "Reload before erasing changed data.",
          409,
        );
        store.erase(session.id, expectedRevision);
        res.setHeader("Set-Cookie", setCookie("becoming_session", "", 0));
        return render(
          "Becoming data erased",
          "<p>Your retained Becoming data and sessions have been removed. Pre-erasure authorizations no longer work. Remove this app from ChatGPT and delete any chat history or downloaded copies separately.</p>",
        );
      }
      if (url.pathname === "/account/consent") {
        const consent = {
          storage: form.has("storage"),
          compare: form.has("compare"),
          displayName: (form.get("displayName") || "").trim(),
        };
        requireThat(
          consent.displayName.length <= 80 &&
            (!consent.compare ||
              (consent.storage && consent.displayName.length > 0)),
          "CONSENT_INVALID",
          "Comparison requires storage consent and a chosen display name.",
        );
        store.change(
          session.id,
          expectedRevision,
          form.get("requestId"),
          { consent },
          (s) => {
            s.consent = {
              ...consent,
              at: new Date().toISOString(),
              version: "becoming-consent/1",
            };
          },
        );
        return redirect("/account");
      }
      if (url.pathname === "/account/import") {
        requireThat(
          state.consent.storage && form.has("confirm"),
          "IMPORT_CONFIRMATION",
          "Storage consent and explicit replacement confirmation are required.",
        );
        let raw = form.get("backup");
        try {
          const outer = JSON.parse(raw);
          if (outer.format === "becoming-account-export/1")
            raw = outer.journeyBackup;
        } catch {}
        let journey;
        try {
          journey = parseJourneyBackup(raw);
        } catch (error) {
          throw new AppError("INVALID_BACKUP", error.message, 400);
        }
        store.change(
          session.id,
          expectedRevision,
          form.get("requestId"),
          { backup: raw },
          (s) => {
            s.journey = journey;
          },
        );
        return redirect("/account");
      }
      if (url.pathname === "/review/decision") {
        requireThat(
          form.has("inspected"),
          "REVIEW_INSPECTION",
          "Actual demonstration inspection is required.",
        );
        reviewEvidence(
          store,
          session.id,
          form.get("owner"),
          form.get("evidenceId"),
          form.get("decision"),
          Number(form.get("mark")),
          form.get("rationale") || "",
          expectedRevision,
          session.reviewer,
        );
        return redirect("/review");
      }
      throw new AppError("NOT_FOUND", "Page not found.", 404);
    } catch (error) {
      const status = error instanceof AppError ? error.status : 500;
      if (req.url?.startsWith("/mcp"))
        return json(
          { error: error instanceof AppError ? error.code : "INTERNAL" },
          status,
        );
      return render(
        "Action could not be completed",
        `<p>${esc(error instanceof AppError ? error.message : "The operation could not be completed. No success is claimed. Reload and retry; contact the publisher if it persists.")}</p><p><a href="/account">Return to your account</a></p>`,
        status,
      );
    }
  });
  return {
    server,
    store,
    auth,
    config,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      store.close();
    },
  };
}
