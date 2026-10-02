/** Test-only ChatGPT bridge substitute. Real MCP transport; synthetic IdP. */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fixture, tool } from "./fixture.mjs";
const f = await fixture();
let client = await f.client("alice");
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/info") {
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          appOrigin: f.origin,
          idpOrigin: f.idpOrigin,
          label: "TEST FIXTURE — no live ChatGPT",
        }),
      );
    }
    if (req.url === "/tool" && req.method === "POST") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const input = JSON.parse(Buffer.concat(chunks).toString());
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify(await tool(client, input.name, input.args)),
      );
    }
    if (req.url === "/review-all" && req.method === "POST") {
      // Test harness exercises the same reviewer HTTP form boundary as a human.
      const session = await f.login("reviewer");
      const owner = f.app.store.identity(f.config.issuer, "alice");
      const state = f.app.store.read(owner);
      for (const e of state.evidence.filter((e) => e.status === "pending")) {
        const html = await (
          await fetch(f.origin + "/review", {
            headers: { Cookie: session.cookie },
          })
        ).text();
        const form = html.slice(html.indexOf("<form"));
        const response = await f.post(
          session,
          "/review/decision",
          {
            owner,
            evidenceId: e.id,
            decision: "accepted",
            mark: "3",
            rationale:
              "TEST FIXTURE: inspected standardized sample work in the browser acceptance harness.",
            inspected: "on",
          },
          form,
        );
        if (response.status !== 303) throw new Error("Fixture review failed");
      }
      return res.end("OK TEST FIXTURE");
    }
    if (req.url === "/") {
      const initial = (await tool(client, "becoming_open")).structuredContent;
      const bridge = `<script>window.openai={toolOutput:${JSON.stringify(initial).replaceAll("<", "\\u003c")},callTool:async(name,args)=>{const r=await fetch('/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args})});return r.json();},openExternal:({href})=>window.open(href,'_blank')};</script>`;
      let html = readFileSync(
        new URL("../assets/widget.html", import.meta.url),
        "utf8",
      );
      html = html
        .replace("<script>", bridge + "<script>")
        .replace(
          "<header>",
          '<p class="message">TEST FIXTURE — ChatGPT bridge substitute; synthetic OAuth identities. Actual MCP tools and widget.</p><header>',
        );
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(html);
    }
    res.statusCode = 404;
    res.end("Not found");
  } catch {
    res.statusCode = 500;
    res.end("Fixture harness failed");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
console.log(
  JSON.stringify({
    harnessOrigin: `http://127.0.0.1:${server.address().port}`,
    appOrigin: f.origin,
  }),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void (async () => {
      await new Promise((r) => server.close(r));
      await f.close();
      process.exit(0);
    })();
  });
