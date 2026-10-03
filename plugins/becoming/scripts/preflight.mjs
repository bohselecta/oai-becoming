// Read-only deployment verification. Never logs tokens, subjects or private text.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const root = fileURLToPath(new URL("../../../", import.meta.url));
export async function preflight(origin, { fixture = false, token } = {}) {
  const url = new URL(origin);
  assert.equal(url.origin, origin, "Use a canonical origin without a path or trailing slash.");
  assert.ok(url.protocol === "https:" || (fixture && url.protocol === "http:" && url.hostname === "127.0.0.1"), "Live checks require HTTPS.");
  const get = async (path) => {
    const response = await fetch(new URL(path, origin), { redirect: "error", signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, "Public readiness endpoint must return 200.");
    return response.json();
  };
  const sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  if (!fixture) {
    const changes = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim();
    assert.equal(changes, "", "Use a clean exact-source checkout for live receipts.");
  }
  const health = await get("/health");
  assert.equal(health.status, "ok");
  if (!fixture) {
    assert.equal(health.sourceRevision, sourceRevision, "Deployment must match this exact checkout.");
    assert.equal(health.access, "invite-only-pilot", "Owner testing must use the pilot allowlist.");
  }
  const resource = await get("/.well-known/oauth-protected-resource/mcp");
  assert.equal(resource.resource, `${origin}/mcp`);
  assert.deepEqual(resource.scopes_supported, ["becoming:read"]);
  assert.equal(resource.authorization_servers.length, 1);
  const issuer = resource.authorization_servers[0];
  assert.ok(new URL(issuer).protocol === "https:" || (fixture && new URL(issuer).origin === `http://127.0.0.1:${new URL(issuer).port}`));
  const discovery = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`, { redirect: "error", signal: AbortSignal.timeout(10000) });
  assert.equal(discovery.status, 200);
  const metadata = await discovery.json();
  assert.equal(metadata.issuer, issuer);
  assert.ok(metadata.code_challenge_methods_supported.includes("S256"));
  const client = new Client({ name: "Becoming deployment preflight", version: "1.0.0" });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
      requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    }));
    const listed = await client.listTools();
    // The SDK parser strips host-specific top-level extensions; inspect the wire
    // as well so mirrored OAuth metadata is actually verified.
    const wire = await fetch(`${origin}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
      redirect: "error", signal: AbortSignal.timeout(10000),
    });
    assert.equal(wire.status, 200);
    const tools = (await wire.json()).result.tools;
    assert.deepEqual(tools.map((t) => t.name), listed.tools.map((t) => t.name));
    assert.equal(tools.length, 11);
    for (const tool of tools) {
      assert.equal(tool.inputSchema.additionalProperties, false);
      assert.deepEqual(tool.securitySchemes, tool._meta.securitySchemes);
      assert.equal(tool.annotations.openWorldHint, false);
    }
    const { resources } = await client.listResources();
    assert.equal(resources.length, 1);
    const widget = await client.readResource({ uri: resources[0].uri });
    assert.equal(widget.contents[0].mimeType, "text/html+skybridge");
    assert.deepEqual(widget.contents[0]._meta["openai/widgetCSP"].connect_domains, []);
    let realOAuth = "NOT_RUN";
    if (token) {
      const result = await client.callTool({ name: "becoming_open", arguments: {} });
      assert.ok(!result.isError, "Signed pilot tool call must succeed.");
      assert.equal(result.structuredContent.status, "ready", "Grant human storage consent before checking authenticated readiness.");
      realOAuth = fixture ? "FIXTURE_PASS" : "PASS_READ_ONLY_BEARER";
    }
    return {
      status: "PASS", label: fixture ? "TEST FIXTURE — NOT LIVE" : "LIVE HTTPS/MCP PREFLIGHT — ChatGPT host acceptance still NOT_RUN",
      sourceRevision, deployedRevision: health.sourceRevision, origin, issuer,
      lockSha256: createHash("sha256").update(readFileSync(new URL("../package-lock.json", import.meta.url))).digest("hex"),
      checkedAt: new Date().toISOString(), toolNames: tools.map((t) => t.name),
      realOAuth, chatgptSandbox: "NOT_RUN", writes: "NONE",
    };
  } finally { await client.close(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const receipt = await preflight(process.argv[2], { token: process.env.BECOMING_ACCEPTANCE_TOKEN });
    const output = new URL("../qa-output/live-preflight.json", import.meta.url);
    mkdirSync(new URL("../qa-output/", import.meta.url), { recursive: true });
    writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(JSON.stringify(receipt, null, 2));
  } catch {
    console.error("Preflight failed. Check canonical HTTPS origin, exact deployment revision, pilot access, metadata, S256 and MCP descriptors. No tokens or private records were logged.");
    process.exitCode = 1;
  }
}
