import { createRemoteJWKSet, jwtVerify } from "jose";
import { AppError, requireThat, secret, digest } from "./store.mjs";

const local = (url) =>
  url.protocol === "http:" &&
  ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
export function validateConfig(c) {
  for (const key of ["origin", "issuer", "clientId", "dataKey", "database"])
    requireThat(
      typeof c[key] === "string" && c[key].length > 0,
      "CONFIG",
      `${key} is required.`,
    );
  for (const key of ["origin", "issuer"]) {
    const u = new URL(c[key]);
    requireThat(
      !u.username &&
        !u.password &&
        !u.search &&
        !u.hash &&
        (u.protocol === "https:" || (c.development && local(u))),
      "CONFIG",
      `${key} requires HTTPS (loopback only in development).`,
    );
    if (key === "origin")
      requireThat(
        u.pathname === "/",
        "CONFIG",
        "APP_ORIGIN must have no path.",
      );
  }
  requireThat(
    c.origin === new URL(c.origin).origin,
    "CONFIG",
    "APP_ORIGIN must be canonical without trailing slash.",
  );
  if (c.development)
    requireThat(
      local(new URL(c.origin)) && local(new URL(c.issuer)),
      "CONFIG",
      "Development mode is restricted to loopback app and issuer.",
    );
  c.resource = `${c.origin}/mcp`;
  c.reviewerSubjects ||= [];
  c.allowedOrigins ||= [c.origin, "https://chatgpt.com"];
  c.trustedOidcOrigins ||= [new URL(c.issuer).origin];
  return c;
}
export async function createAuth(config, store) {
  const checkEndpoint = (value) => {
    const u = new URL(value);
    requireThat(
      config.trustedOidcOrigins.includes(u.origin) &&
        !u.username &&
        !u.password &&
        (u.protocol === "https:" || (config.development && local(u))),
      "OIDC_CONFIG",
      "OIDC endpoint is outside configured trusted origins.",
    );
    return u;
  };
  const metadataUrl = new URL(
    `${config.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
  );
  const response = await fetch(metadataUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  requireThat(response.ok, "OIDC_CONFIG", "OIDC discovery failed.");
  const metadata = await response.json();
  requireThat(
    metadata.issuer === config.issuer &&
      metadata.code_challenge_methods_supported?.includes("S256"),
    "OIDC_CONFIG",
    "Issuer mismatch or missing PKCE S256 support.",
  );
  const jwks = createRemoteJWKSet(checkEndpoint(metadata.jwks_uri), {
    timeoutDuration: 5000,
  });
  const authorize = checkEndpoint(metadata.authorization_endpoint);
  const tokenUrl = checkEndpoint(metadata.token_endpoint);
  const verify = async (token, audience) => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.issuer,
      audience,
      algorithms: ["RS256", "ES256"],
      requiredClaims: ["sub", "iat", "exp"],
      maxTokenAge: 3600,
      clockTolerance: 0,
    });
    requireThat(
      typeof payload.sub === "string" &&
        payload.sub.length > 0 &&
        typeof payload.iat === "number" &&
        payload.iat <= Date.now() / 1000,
      "AUTH_INVALID",
      "Invalid subject or issuance time.",
      401,
    );
    const id = store.identity(config.issuer, payload.sub);
    store.assertToken(id, payload.iat);
    return { id, subject: payload.sub, payload };
  };
  return {
    metadata,
    challenge(scopes = [], error) {
      return `Bearer resource_metadata="${config.origin}/.well-known/oauth-protected-resource/mcp"${scopes.length ? `, scope="${scopes.join(" ")}"` : ""}${error ? `, error="${error}"` : ""}`;
    },
    async bearer(header) {
      requireThat(
        typeof header === "string" && /^Bearer [^ ]+$/i.test(header),
        "AUTH_REQUIRED",
        "Sign in to Becoming.",
        401,
      );
      try {
        const actor = await verify(header.slice(7), config.resource);
        requireThat(
          typeof actor.payload.scope === "string",
          "AUTH_INVALID",
          "Missing token scopes.",
          401,
        );
        actor.scopes = actor.payload.scope.split(" ");
        return actor;
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(
          "AUTH_INVALID",
          "Authorization is invalid or expired.",
          401,
        );
      }
    },
    startLogin() {
      const state = secret(),
        verifier = secret(),
        nonce = secret();
      store.putTransient("login", state, { verifier, nonce }, 600);
      const url = new URL(authorize);
      for (const [k, v] of Object.entries({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: `${config.origin}/auth/callback`,
        scope: "openid",
        state,
        nonce,
        code_challenge: digest(verifier),
        code_challenge_method: "S256",
      }))
        url.searchParams.set(k, v);
      return { state, url: url.href };
    },
    async callback(url, cookieState) {
      const state = url.searchParams.get("state");
      requireThat(
        state && state === cookieState,
        "LOGIN_STATE",
        "Sign-in state did not match this browser.",
        400,
      );
      const flow = store.transient("login", state, true);
      requireThat(
        flow,
        "LOGIN_EXPIRED",
        "Sign-in expired or was already used.",
        400,
      );
      const iss = url.searchParams.get("iss");
      requireThat(
        (!metadata.authorization_response_iss_parameter_supported && !iss) ||
          iss === config.issuer,
        "LOGIN_ISSUER",
        "Sign-in issuer did not match.",
        400,
      );
      const code = url.searchParams.get("code");
      requireThat(
        code && !url.searchParams.has("error"),
        "LOGIN_FAILED",
        "Sign-in was not completed.",
        400,
      );
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: config.clientId,
        redirect_uri: `${config.origin}/auth/callback`,
        code_verifier: flow.verifier,
      });
      if (config.clientSecret) body.set("client_secret", config.clientSecret);
      const response = await fetch(tokenUrl, {
        method: "POST",
        body,
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      requireThat(
        response.ok,
        "LOGIN_FAILED",
        "The identity provider did not complete sign-in.",
        400,
      );
      const tokens = await response.json();
      let actor;
      try {
        actor = await verify(tokens.id_token, config.clientId);
      } catch {
        throw new AppError(
          "LOGIN_FAILED",
          "Identity verification failed.",
          400,
        );
      }
      requireThat(
        actor.payload.nonce === flow.nonce,
        "LOGIN_NONCE",
        "Identity nonce did not match.",
        400,
      );
      const session = secret();
      store.putTransient(
        "session",
        session,
        {
          id: actor.id,
          reviewer: config.reviewerSubjects.includes(actor.subject),
          csrf: secret(),
        },
        3600,
      );
      return session;
    },
  };
}
