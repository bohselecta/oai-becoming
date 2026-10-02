import { createServer } from "node:http";
import { requireThat } from "./store.mjs";

// Explicit deployment preparation, never an authentication fallback. No Store,
// OAuth client, participant seed, account session or MCP service is instantiated.
export function createSetupApp(config) {
  const origin = new URL(config.origin);
  requireThat(
    origin.origin === config.origin &&
      !origin.username && !origin.password &&
      (origin.protocol === "https:" ||
        (config.development && origin.protocol === "http:" && origin.hostname === "127.0.0.1")),
    "CONFIG", "Setup requires a canonical HTTPS origin.",
  );
  requireThat(
    config.sourceRevision === undefined || /^[a-f0-9]{40}$/.test(config.sourceRevision),
    "CONFIG", "SOURCE_REVISION must be an exact Git commit SHA.",
  );
  const server = createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const json = (status, value) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(value));
    };
    if (req.headers.host !== origin.host)
      return json(403, { error: "HOST_FORBIDDEN" });
    if (req.method === "GET" && req.url === "/health")
      return json(200, {
        status: "setup-required", app: "Becoming", version: "0.1.0",
        sourceRevision: config.sourceRevision || null,
        access: "setup-only", setupRequired: true,
      });
    if (req.method === "GET" && req.url === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Becoming · Setup</title><h1>Becoming is being set up</h1><p>Sign-in and saved records are unavailable while the publisher finishes setup.</p><p>By Corgi-Verse Software · Created by Hayden Lindley. Independent of OpenAI.</p></html>');
    }
    return json(503, { error: "SETUP_REQUIRED", message: "Becoming sign-in and records are unavailable during setup." });
  });
  return {
    server,
    close: () => new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    }),
  };
}
