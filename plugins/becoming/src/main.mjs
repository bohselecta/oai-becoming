import { createApp } from "./http.mjs";
import { runtimeConfig } from "./runtime-config.mjs";
import { createSetupApp } from "./setup.mjs";
try {
  const config = runtimeConfig(process.env);
  const app = config.setupMode ? createSetupApp(config) : await createApp(config);
  const port = Number(process.env.PORT || 8787);
  app.server.listen(port, process.env.BIND_ADDRESS || "127.0.0.1", () =>
    console.log(config.setupMode ? "Becoming setup-only server started; OAuth and private data access are disabled." : "Becoming MCP and account server started."),
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
