import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { storageKey, runtimeConfig } from "../src/runtime-config.mjs";
import { Store } from "../src/store.mjs";
import { port } from "./fixture.mjs";

test("Render-generated random secret yields a stable storage key without changing existing base64 keys or silently selecting conflicting inputs", () => {
  const providerSecret = randomBytes(32).toString("hex");
  const key = storageKey({ DATA_KEY_SECRET: providerSecret });
  assert.equal(Buffer.from(key, "base64").length, 32);
  assert.equal(storageKey({ DATA_KEY: key }), key);
  assert.throws(() => storageKey({ DATA_KEY: key, DATA_KEY_SECRET: providerSecret }), /only one/);
  assert.throws(() => storageKey({ DATA_KEY_SECRET: "too-short" }), /at least 32/);
  const first = new Store(":memory:", key);
  const second = new Store(":memory:", storageKey({ DATA_KEY_SECRET: providerSecret }));
  try {
    const id = first.identity("https://example.invalid/", "fixture-owner");
    assert.equal(second.identity("https://example.invalid/", "fixture-owner"), id);
    const sealed = first.seal({ account: "PRIVATE FIXTURE" }, id);
    assert.deepEqual(second.open(sealed, id), { account: "PRIVATE FIXTURE" });
  } finally { first.close(); second.close(); }
});

test("actual main entrypoint serves explicit setup readiness with no database, account session, OAuth or MCP access; disabling setup fails closed until configured", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "becoming-setup-test-"));
  const database = join(dir, "private.sqlite");
  const origin = `http://127.0.0.1:${await port()}`;
  const providerSecret = randomBytes(32).toString("hex");
  const env = {
    ...process.env, NODE_ENV: "development", SETUP_MODE: "true",
    APP_ORIGIN: origin, RENDER_EXTERNAL_URL: "https://provider-fallback.invalid",
    PORT: new URL(origin).port, BIND_ADDRESS: "127.0.0.1",
    DATABASE_PATH: database, DATA_KEY_SECRET: providerSecret,
    SOURCE_REVISION: "0".repeat(40),
  };
  delete env.DATA_KEY;
  delete env.OIDC_ISSUER;
  delete env.OIDC_CLIENT_ID;
  const child = spawn(process.execPath, ["src/main.mjs"], { env, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  child.stdout.on("data", (chunk) => { logs += chunk; });
  child.stderr.on("data", (chunk) => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
    rmSync(dir, { recursive: true, force: true });
  });
  await Promise.race([
    once(child.stdout, "data"),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("Setup entrypoint startup timed out.")), 10000); timer.unref(); }),
  ]);
  const health = await (await fetch(origin + "/health")).json();
  assert.equal(health.status, "setup-required");
  assert.equal(health.access, "setup-only");
  assert.equal(health.sourceRevision, "0".repeat(40));
  assert.equal(health.setupRequired, true);
  assert.match(await (await fetch(origin)).text(), /being set up/);
  for (const path of ["/account", "/auth/login", "/auth/callback", "/review", "/mcp", "/.well-known/oauth-protected-resource/mcp"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 503, path);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal((await response.json()).error, "SETUP_REQUIRED");
  }
  const write = await fetch(origin + "/mcp", { method: "POST", body: "PRIVATE INPUT" });
  assert.equal(write.status, 503);
  assert.equal(existsSync(database), false);
  assert.ok(!logs.includes(providerSecret));
  assert.ok(!logs.includes("PRIVATE INPUT"));
  // fetch normalizes Host to the URL host. Use an actual HTTP request to
  // exercise a hostile Host header, retaining the denial assertion.
  const deniedStatus = await new Promise((resolve, reject) => {
    const req = httpRequest(origin + "/health", { headers: { Host: "evil.invalid" } }, (res) => {
      res.resume(); res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", reject); req.end();
  });
  assert.equal(deniedStatus, 403);
  const exited = once(child, "exit"); child.kill("SIGTERM"); await exited;
  const disabled = spawn(process.execPath, ["src/main.mjs"], { env: { ...env, SETUP_MODE: "false" }, stdio: ["ignore", "ignore", "pipe"] });
  let failure = "";
  disabled.stderr.on("data", (chunk) => { failure += chunk; });
  assert.equal((await once(disabled, "exit"))[0], 1);
  assert.match(failure, /did not start/);
  assert.ok(!failure.includes(providerSecret));
  assert.equal(existsSync(database), false);
});

test("setup is explicit and uses the actual provider origin only as an absent-origin fallback", () => {
  assert.equal(runtimeConfig({}).setupMode, false);
  assert.equal(runtimeConfig({ RENDER_EXTERNAL_URL: "https://reserved.invalid" }).origin, "https://reserved.invalid");
  assert.equal(runtimeConfig({ APP_ORIGIN: "https://custom.invalid", RENDER_EXTERNAL_URL: "https://reserved.invalid" }).origin, "https://custom.invalid");
  assert.throws(() => runtimeConfig({ SETUP_MODE: "TRUE" }), /true or false/);
});
