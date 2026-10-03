import { createHash } from "node:crypto";
import { requireThat } from "./store.mjs";

const list = (s) => s ? s.split(",").map((v) => v.trim()).filter(Boolean) : undefined;

// Preserve the existing base64 key path. Render-generated secrets are a separate,
// explicit input; never silently prefer one key or rotate an existing database.
export function storageKey(env) {
  requireThat(!(env.DATA_KEY && env.DATA_KEY_SECRET), "CONFIG", "Configure only one storage key input.");
  if (!env.DATA_KEY_SECRET) return env.DATA_KEY;
  requireThat(
    typeof env.DATA_KEY_SECRET === "string" &&
      Buffer.byteLength(env.DATA_KEY_SECRET) >= 32 &&
      Buffer.byteLength(env.DATA_KEY_SECRET) <= 4096,
    "CONFIG", "DATA_KEY_SECRET must be a provider-generated random secret of at least 32 bytes.",
  );
  return createHash("sha256")
    .update("becoming-render-storage-key/1\0")
    .update(env.DATA_KEY_SECRET)
    .digest("base64");
}

export function runtimeConfig(env) {
  requireThat(
    env.SETUP_MODE === undefined || ["true", "false"].includes(env.SETUP_MODE),
    "CONFIG", "SETUP_MODE must be true or false.",
  );
  return {
    setupMode: env.SETUP_MODE === "true",
    origin: env.APP_ORIGIN || env.RENDER_EXTERNAL_URL,
    issuer: env.OIDC_ISSUER,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET,
    dataKey: storageKey(env),
    database: env.DATABASE_PATH,
    development: env.NODE_ENV === "development",
    reviewerSubjects: list(env.REVIEWER_SUBJECTS),
    pilotMode: env.PILOT_MODE,
    pilotSubjects: list(env.PILOT_SUBJECTS),
    sourceRevision: env.RENDER_GIT_COMMIT || env.SOURCE_REVISION,
    allowedOrigins: list(env.ALLOWED_ORIGINS),
    trustedOidcOrigins: list(env.OIDC_TRUSTED_ORIGINS),
  };
}
