import test from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { fixture } from "./fixture.mjs";
import { exportJourney, freshJourney } from "../../../src/journey.js";

// Hold a real HTTP form after its session was read, then invalidate its authority.
// The store hook synchronizes the test without sleeps or a runtime debug route.
async function heldForm(f, session, path, fields) {
  const html = await f.account(session);
  const encoded = new URLSearchParams({
    csrf: f.hidden(html, "csrf"), revision: f.hidden(html, "revision"),
    requestId: f.hidden(html, "requestId"), ...fields,
  }).toString();
  let observed;
  const started = new Promise((resolve) => { observed = resolve; });
  const original = f.app.store.transient;
  f.app.store.transient = function (kind, token, ...args) {
    const result = original.call(this, kind, token, ...args);
    if (kind === "session" && session.cookie === `becoming_session=${token}`) observed();
    return result;
  };
  let req;
  const response = new Promise((resolve, reject) => {
    req = request(f.origin + path, { method: "POST", headers: {
      Cookie: session.cookie, Origin: f.origin,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(encoded),
    } }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", reject);
    req.write(encoded.slice(0, 1));
  });
  await started;
  f.app.store.transient = original;
  return { finish: () => { req.end(encoded.slice(1)); return response; } };
}

for (const action of ["erase", "logout", "expire"]) {
  test(`in-flight consent cannot survive session ${action}`, { timeout: 10000 }, async (t) => {
    const f = await fixture({ pilotMode: true, pilotSubjects: ["alice"] });
    t.after(() => f.close());
    const session = await f.login("alice");
    const held = await heldForm(f, session, "/account/consent", { storage: "on" });
    if (action === "expire") {
      f.app.store.db.exec("UPDATE transient SET expires=0 WHERE kind='session'");
    } else {
      const response = await f.post(session, `/account/${action}`, { confirmation: "ERASE" });
      assert.equal(response.status, action === "erase" ? 200 : 303);
    }
    assert.equal(await held.finish(), 401);
    assert.equal(f.app.store.all().length, 0);
  });
}

test("in-flight import cannot use storage consent withdrawn during upload", { timeout: 10000 }, async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  const session = await f.login("alice");
  await f.consent(session);
  const held = await heldForm(f, session, "/account/import", {
    revision: "2", confirm: "on", backup: exportJourney(freshJourney()),
  });
  assert.equal((await f.post(session, "/account/consent", {})).status, 303);
  assert.equal(await held.finish(), 400);
  const state = f.app.store.all()[0].state;
  assert.equal(state.consent.storage, false);
  assert.equal(state.revision, 2);
});
