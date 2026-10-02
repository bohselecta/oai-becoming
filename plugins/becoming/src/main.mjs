import { createApp } from "./http.mjs";
const list = (s) =>
  s
    ? s
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : undefined;
try {
  const app = await createApp({
    origin: process.env.APP_ORIGIN,
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    dataKey: process.env.DATA_KEY,
    database: process.env.DATABASE_PATH,
    development: process.env.NODE_ENV === "development",
    reviewerSubjects: list(process.env.REVIEWER_SUBJECTS),
    pilotMode: process.env.PILOT_MODE,
    pilotSubjects: list(process.env.PILOT_SUBJECTS),
    sourceRevision: process.env.RENDER_GIT_COMMIT || process.env.SOURCE_REVISION,
    allowedOrigins: list(process.env.ALLOWED_ORIGINS),
    trustedOidcOrigins: list(process.env.OIDC_TRUSTED_ORIGINS),
  });
  const port = Number(process.env.PORT || 8787);
  app.server.listen(port, process.env.BIND_ADDRESS || "127.0.0.1", () =>
    console.log("Becoming MCP and account server started."),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => {
      void app.close().then(() => process.exit(0));
    });
} catch {
  console.error(
    "Becoming did not start. Check HTTPS origin, OIDC discovery/PKCE, client registration, DATA_KEY and durable database configuration. No credentials are logged.",
  );
  process.exitCode = 1;
}
