import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fixture, tool } from "./fixture.mjs";
import { UI_URI } from "../src/tools.mjs";
import { reviewEvidence, estimate } from "../src/measurement.mjs";

const unwrap = (r) => {
  assert.equal(r.isError, undefined, JSON.stringify(r));
  return r.structuredContent;
};
const request = (s, args) => ({
  expectedRevision: s.revision,
  requestId: crypto.randomUUID(),
  ...args,
});
test("C2–C6: actual HTTP MCP, OAuth account consent, correctable journey, reviewer evidence, durable restart and erase", async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  const anonymous = await f.client("alice", "", false);
  const wire = await fetch(f.origin + "/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    }),
  });
  const tools = (await wire.json()).result.tools;
  assert.equal((await anonymous.listTools()).tools.length, tools.length);
  assert.equal(tools.length, 11);
  for (const x of tools) {
    assert.equal(x.inputSchema.additionalProperties, false);
    assert.ok(x._meta.ui.resourceUri);
    assert.deepEqual(x.securitySchemes, x._meta.securitySchemes);
    assert.equal(x.annotations.openWorldHint, false);
  }
  assert.ok(!tools.some((x) => /consent|accept|review|erase/.test(x.name)));
  const resource = await anonymous.readResource({ uri: UI_URI });
  assert.equal(resource.contents[0].mimeType, "text/html+skybridge");
  assert.ok(!resource.contents[0].text.includes("fixture"));
  assert.ok(!resource.contents[0].text.includes("alice"));
  assert.deepEqual(
    resource.contents[0]._meta["openai/widgetCSP"].connect_domains,
    [],
  );
  const metadata = await (
    await fetch(f.origin + "/.well-known/oauth-protected-resource/mcp")
  ).json();
  assert.equal(metadata.resource, f.origin + "/mcp");
  const unauth = await fetch(f.origin + "/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "becoming_open", arguments: {} },
    }),
  });
  assert.equal(unauth.status, 401);
  assert.match(unauth.headers.get("www-authenticate"), /resource_metadata/);
  const alice = await f.client("alice");
  let s = unwrap(await tool(alice, "becoming_open"));
  assert.equal(s.status, "consent-required");
  assert.equal(
    (
      await tool(alice, "becoming_save_answer", {
        expectedRevision: 0,
        requestId: "test-not-consented",
        stage: "interest",
        value: "music",
      })
    ).structuredContent.code,
    "CONSENT_REQUIRED",
  );
  const session = await f.login("alice");
  await f.consent(session, true);
  s = unwrap(await tool(alice, "becoming_open"));
  assert.equal(s.revision, 1);
  const badCsrf = await f.post(session, "/account/consent", {
    csrf: "wrong",
    storage: "on",
  });
  assert.equal(badCsrf.status, 403);
  for (const [stage, value] of [
    ["interest", "<img src=x onerror=alert(1)> games"],
    ["story", "I coordinated a raid and checked our plan."],
    ["skills", ["coordination"]],
    ["direction", "Write a guide"],
    ["reward", "Help a friend"],
    ["constraints", "Ten minutes"],
    ["action", "Write three steps"],
    [
      "reflection",
      {
        outcome: "The guide confused my friend.",
        evidenceStatus: "contradicts",
      },
    ],
  ])
    s = unwrap(
      await tool(alice, "becoming_save_answer", request(s, { stage, value })),
    );
  assert.equal(s.record.evidenceStatus, "contradicts");
  assert.equal(s.evidence.length, 0);
  const pendingRetry = request(s, { nextStep: "Try one clearer example" });
  s = unwrap(await tool(alice, "becoming_next_step", pendingRetry));
  assert.equal(s.record.attempts.length, 1);
  const rev = s.revision;
  s = unwrap(await tool(alice, "becoming_next_step", pendingRetry));
  assert.equal(s.revision, rev);
  assert.equal(s.record.attempts.length, 1);
  assert.equal(
    (
      await tool(alice, "becoming_correct_record", {
        ...request(s, { patch: { story: "x" } }),
        expectedRevision: 0,
      })
    ).structuredContent.code,
    "STALE_REVISION",
  );
  s = unwrap(
    await tool(
      alice,
      "becoming_correct_record",
      request(s, {
        patch: { story: "I followed a plan rather than coordinated it." },
      }),
    ),
  );
  assert.deepEqual(s.record.skills, []);
  assert.equal(s.record.outcome, "");
  assert.equal(s.record.attempts[0].evidenceStatus, "contradicts");
  const selfId = f.app.store.identity(f.config.issuer, "alice");
  for (let i = 0; i < 3; i++)
    s = unwrap(
      await tool(
        alice,
        "becoming_submit_evidence",
        request(s, {
          demonstrationId: "research-" + i,
          title: "Actual work account " + i,
          account:
            "I inspected three distinct sources and contrasted their claims.",
          criterion:
            "Triangulate independent sources and disclose uncertainty.",
          date: new Date().toISOString().slice(0, 10),
          skill: "research",
          mode: "independent",
        }),
      ),
    );
  assert.equal(
    unwrap(
      await tool(alice, "becoming_placement", {
        skill: "research",
        mode: "independent",
      }),
    ).placement.score,
    null,
  );
  assert.throws(
    () =>
      reviewEvidence(
        f.app.store,
        selfId,
        selfId,
        s.evidence[0].id,
        "accepted",
        2,
        "Inspected the actual work.",
        s.revision,
        true,
      ),
    /separately authorized/,
  );
  const reviewer = await f.login("reviewer");
  for (const e of s.evidence) {
    const page = await (
      await fetch(f.origin + "/review", {
        headers: { Cookie: reviewer.cookie },
      })
    ).text();
    const form = page.slice(page.indexOf("<form"));
    const result = await f.post(
      reviewer,
      "/review/decision",
      {
        owner: selfId,
        evidenceId: e.id,
        decision: "accepted",
        mark: "2",
        rationale:
          "Inspected actual work, sources and uncertainty against the criterion.",
        inspected: "on",
      },
      form,
    );
    assert.equal(result.status, 303, await result.text());
  }
  s = unwrap(await tool(alice, "becoming_open"));
  assert.equal(
    s.evidence.every((e) => e.status === "accepted"),
    true,
  );
  let p = unwrap(
    await tool(alice, "becoming_placement", {
      skill: "research",
      mode: "independent",
    }),
  ).placement;
  assert.equal(p.score, 500);
  assert.equal(p.percentile, null);
  assert.equal(p.sampleSize, 0);
  assert.equal(p.coverage.observedCapabilities, 1);
  assert.equal(
    unwrap(
      await tool(alice, "becoming_placement", {
        skill: "research",
        mode: "assisted",
      }),
    ).placement.score,
    null,
  );
  s = unwrap(
    await tool(
      alice,
      "becoming_create_project",
      request(s, {
        title: "Stronger research",
        nextAction: "Contrast three independent accounts",
        criterion: "Record what evidence would change the decision",
        skill: "research",
        mode: "independent",
        targetScore: 750,
      }),
    ),
  );
  const frozen = structuredClone(s.projects[0].target);
  s = unwrap(
    await tool(
      alice,
      "becoming_update_project",
      request(s, { projectId: s.projects[0].id, action: "practice-done" }),
    ),
  );
  assert.equal(s.projects[0].status, "open");
  assert.deepEqual(s.projects[0].target, frozen);
  s = unwrap(
    await tool(
      alice,
      "becoming_revoke_evidence",
      request(s, { evidenceId: s.evidence[0].id }),
    ),
  );
  assert.equal(
    unwrap(
      await tool(alice, "becoming_placement", {
        skill: "research",
        mode: "independent",
      }),
    ).placement.score,
    null,
  );
  const exportResponse = await fetch(f.origin + "/account/export", {
    headers: { Cookie: session.cookie },
  });
  assert.match(exportResponse.headers.get("content-disposition"), /attachment/);
  const backup = await exportResponse.json();
  assert.equal(backup.evidence.length, 3);
  const invalidImport = await f.post(session, "/account/import", {
    confirm: "on",
    backup: '{"version":999}',
  });
  assert.equal(invalidImport.status, 400);
  const html = await f.account(session);
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes("<img src=x"));
  const fileBytes = readFileSync(f.config.database);
  assert.ok(!fileBytes.includes(Buffer.from("coordinated a raid")));
  assert.ok(!fileBytes.includes(Buffer.from("Inspected actual work")));
  await f.restart();
  const returned = await f.client("alice");
  s = unwrap(await tool(returned, "becoming_open"));
  assert.equal(s.record.story, "I followed a plan rather than coordinated it.");
  assert.equal(s.projects.length, 1);
  const bob = await f.client("bob");
  assert.equal(
    unwrap(await tool(bob, "becoming_open")).status,
    "consent-required",
  );
  const restoredSession = await f.login("alice");
  const restore = await f.post(restoredSession, "/account/import", {
    confirm: "on",
    backup: JSON.stringify(backup),
  });
  assert.equal(restore.status, 303);
  assert.equal(
    unwrap(await tool(returned, "becoming_open")).evidence.filter(
      (e) => e.status === "revoked",
    ).length,
    1,
  );
  const withdrawal = await f.post(restoredSession, "/account/consent", {});
  assert.equal(withdrawal.status, 303);
  assert.equal(
    unwrap(await tool(returned, "becoming_open")).status,
    "consent-required",
  );
  assert.equal(
    estimate(f.app.store.read(selfId), "research", "independent").score,
    null,
  );
  const token = await f.issue("alice", f.origin + "/mcp");
  const erased = await f.post(restoredSession, "/account/erase", {
    confirmation: "ERASE",
  });
  assert.equal(erased.status, 200);
  assert.equal(f.app.store.read(selfId).evidence.length, 0);
  assert.ok(
    !(await f.account(restoredSession)).includes("Your data, your choice"),
  );
  const erasedReq = await fetch(f.origin + "/mcp", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test", version: "1" },
      },
    }),
  });
  assert.equal(erasedReq.status, 401);
});

test("C3: issuer, audience, scope, expiry, schema, PKCE/state and browser origin reject unsafe authorization", async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  const session = await f.login("alice");
  await f.consent(session);
  const reader = await f.client("alice", "becoming:read");
  const s = unwrap(await tool(reader, "becoming_open"));
  const denied = await tool(
    reader,
    "becoming_save_answer",
    request(s, { stage: "interest", value: "games" }),
  );
  assert.equal(denied.structuredContent.code, "SCOPE_REQUIRED");
  assert.match(denied._meta["mcp/www_authenticate"][0], /becoming:write/);
  const malformed = await tool(reader, "becoming_open", { userId: "bob" });
  assert.equal(malformed.isError, true);
  for (const token of [
    await f.issue(
      "alice",
      f.origin + "/mcp",
      {},
      { issuer: "https://wrong-issuer.invalid" },
    ),
    await f.issue("alice", f.origin + "/mcp", {}, { exp: 1 }),
    await f.issue(
      "alice",
      f.origin + "/mcp",
      {},
      { iat: Math.floor(Date.now() / 1000) - 7200 },
    ),
    await f.issue("alice", "wrong-audience"),
    (await f.issue("alice", f.origin + "/mcp")).slice(0, -5) + "wrong",
  ]) {
    const r = await fetch(f.origin + "/mcp", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(r.status, 401);
  }
  const callback = await fetch(
    f.origin + "/auth/callback?state=wrong&code=bad",
  );
  assert.equal(callback.status, 400);
  const evil = await fetch(f.origin + "/mcp", {
    method: "GET",
    headers: { Origin: "https://evil.invalid" },
  });
  assert.equal(evil.status, 403);
  const noOrigin = await fetch(f.origin + "/account/consent", {
    method: "POST",
    headers: { Cookie: session.cookie },
    body: new URLSearchParams({ storage: "on" }),
  });
  assert.equal(noOrigin.status, 403);
  const noReview = await fetch(f.origin + "/review", {
    headers: { Cookie: session.cookie },
  });
  assert.equal(noReview.status, 403);
});

test("C2/C3 official OAuth client discovers resource, registers, completes S256 code exchange and executes a consented MCP tool", async (t) => {
  const { auth } = await import("@modelcontextprotocol/sdk/client/auth.js");
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } =
    await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
  const f = await fixture();
  let client;
  t.after(async () => {
    if (client) await client.close();
    await f.close();
  });
  const session = await f.login("alice");
  await f.consent(session);
  let clientInfo, tokens, verifier, authorize;
  const state = crypto.randomUUID();
  const provider = {
    redirectUrl: f.origin + "/fixture-client-callback",
    clientMetadata: {
      client_name: "TEST FIXTURE official MCP OAuth client",
      redirect_uris: [f.origin + "/fixture-client-callback"],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    state: () => state,
    clientInformation: () => clientInfo,
    saveClientInformation: (info) => {
      clientInfo = info;
    },
    tokens: () => tokens,
    saveTokens: (value) => {
      tokens = value;
    },
    saveCodeVerifier: (value) => {
      verifier = value;
    },
    codeVerifier: () => verifier,
    redirectToAuthorization: (value) => {
      authorize = value;
    },
  };
  const options = {
    serverUrl: f.origin + "/mcp",
    resourceMetadataUrl: new URL(
      f.origin + "/.well-known/oauth-protected-resource/mcp",
    ),
    scope: "becoming:read becoming:write",
  };
  assert.equal(await auth(provider, options), "REDIRECT");
  assert.equal(authorize.searchParams.get("resource"), f.origin + "/mcp");
  assert.equal(authorize.searchParams.get("code_challenge_method"), "S256");
  const approved = await fetch(f.idpOrigin + "/approve", {
    method: "POST",
    body: new URLSearchParams({
      params: authorize.searchParams.toString(),
      subject: "alice",
    }),
    redirect: "manual",
  });
  const callback = new URL(approved.headers.get("location"));
  assert.equal(callback.searchParams.get("state"), state);
  assert.equal(callback.searchParams.get("iss"), f.config.issuer);
  assert.equal(
    await auth(provider, {
      ...options,
      authorizationCode: callback.searchParams.get("code"),
    }),
    "AUTHORIZED",
  );
  client = new Client({
    name: "TEST FIXTURE OAuth-completed client",
    version: "1",
  });

  await client.connect(
    new StreamableHTTPClientTransport(new URL(f.origin + "/mcp"), {
      authProvider: provider,
    }),
  );
  const current = unwrap(await tool(client, "becoming_open"));
  assert.equal(current.status, "ready");
  const saved = unwrap(
    await tool(
      client,
      "becoming_save_answer",
      request(current, { stage: "interest", value: "TEST FIXTURE music" }),
    ),
  );
  assert.equal(saved.record.interest, "TEST FIXTURE music");
});
