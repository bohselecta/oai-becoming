import test from "node:test";
import assert from "node:assert/strict";
import { fixture, tool } from "./fixture.mjs";
import { validateConfig } from "../src/auth.mjs";
import { preflight } from "../scripts/preflight.mjs";

test("hosted pilot rejects uninvited signed tokens and browser logins while preserving invited consent and separate reviewer access", async (t) => {
  const f = await fixture({ pilotMode: true, pilotSubjects: ["alice"] });
  t.after(() => f.close());
  const invited = await f.login("alice");
  await f.consent(invited);
  const client = await f.client("alice");
  assert.equal((await tool(client, "becoming_open")).structuredContent.status, "ready");
  const otherToken = await f.issue("bob", f.origin + "/mcp");
  const denied = await fetch(f.origin + "/mcp", {
    method: "GET", headers: { Authorization: `Bearer ${otherToken}` },
  });
  assert.equal(denied.status, 401);
  assert.equal((await denied.json()).error, "PILOT_ACCESS");
  await assert.rejects(f.login("bob"), /Identity verification failed/);
  assert.equal(f.app.store.all().length, 1);
  const reviewer = await f.login("reviewer");
  const page = await fetch(f.origin + "/review", { headers: { Cookie: reviewer.cookie } });
  assert.equal(page.status, 200);
  assert.throws(() => validateConfig({ ...f.config, pilotSubjects: [] }), /PILOT_MODE requires/);
  assert.throws(() => validateConfig({ ...f.config, pilotMode: "TRUE" }), /PILOT_MODE must/);
  const legal = await (await fetch(f.origin + "/legal")).text();
  assert.match(legal, /specific publisher authorization/);
  assert.match(legal, /Becoming OpenAI-Only License/);
  f.config.pilotSubjects = ["bob"];
  f.config.reviewerSubjects = [];
  await f.restart();
  const retainedSession = await fetch(f.origin + "/account", { headers: { Cookie: invited.cookie } });
  assert.equal(retainedSession.status, 403);
  const revokedRole = await fetch(f.origin + "/review", { headers: { Cookie: reviewer.cookie } });
  assert.equal(revokedRole.status, 403);
});

test("deployment preflight executes official HTTP MCP discovery without disguising fixtures or missing host acceptance", async (t) => {
  const f = await fixture({ pilotMode: true, pilotSubjects: ["alice"] });
  t.after(() => f.close());
  const publicReceipt = await preflight(f.origin, { fixture: true });
  assert.equal(publicReceipt.realOAuth, "NOT_RUN");
  assert.equal(publicReceipt.chatgptSandbox, "NOT_RUN");
  assert.match(publicReceipt.label, /NOT LIVE/);
  assert.equal(publicReceipt.toolNames.length, 11);
  await assert.rejects(preflight(f.origin), /HTTPS/);
  const session = await f.login("alice");
  await f.consent(session);
  const token = await f.issue("alice", f.origin + "/mcp");
  const signedReceipt = await preflight(f.origin, { fixture: true, token });
  assert.equal(signedReceipt.realOAuth, "FIXTURE_PASS");
  assert.ok(!JSON.stringify(signedReceipt).includes(token));
  assert.ok(!JSON.stringify(signedReceipt).includes("alice"));
});
