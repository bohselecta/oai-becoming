import { DatabaseSync } from "node:sqlite";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import { freshJourney } from "../../../src/journey.js";

export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export const requireThat = (condition, code, message, status) => {
  if (!condition) throw new AppError(code, message, status);
};
export const digest = (value) =>
  createHash("sha256").update(value).digest("base64url");
export const secret = () => randomBytes(32).toString("base64url");
const fresh = () => ({
  schema: 1,
  revision: 0,
  consent: { storage: false, compare: false, displayName: "" },
  journey: freshJourney(),
  evidence: [],
  projects: [],
  receipts: [],
});

/** One process / one durable volume. All private payloads use AES-256-GCM.
 * User keys are opaque HMACs; no raw issuer subject or bearer tokens are stored. */
export class Store {
  constructor(path, key) {
    requireThat(
      Buffer.from(key, "base64").length === 32,
      "CONFIG",
      "DATA_KEY must be 32 random bytes encoded as base64.",
    );
    this.key = Buffer.from(key, "base64");
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    const version = this.db.prepare("PRAGMA user_version").get().user_version;
    if (version > 1) {
      this.db.close();
      throw new AppError(
        "STORAGE_VERSION",
        "Database version is newer than this server. It was not modified.",
        503,
      );
    }
    this.db
      .exec(`PRAGMA journal_mode=DELETE; PRAGMA secure_delete=ON; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS transient (kind TEXT, id TEXT, payload TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY(kind,id));
      CREATE TABLE IF NOT EXISTS tombstones (id TEXT PRIMARY KEY, deleted INTEGER NOT NULL);
      PRAGMA user_version=1;`);
    this.cleanup();
  }
  identity(issuer, subject) {
    return createHmac("sha256", this.key)
      .update(JSON.stringify([issuer, subject]))
      .digest("base64url");
  }
  seal(value, context) {
    const iv = randomBytes(12);
    const c = createCipheriv("aes-256-gcm", this.key, iv);
    c.setAAD(Buffer.from(context));
    const body = Buffer.concat([c.update(JSON.stringify(value)), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
  }
  open(payload, context) {
    try {
      const b = Buffer.from(payload, "base64");
      const c = createDecipheriv("aes-256-gcm", this.key, b.subarray(0, 12));
      c.setAAD(Buffer.from(context));
      c.setAuthTag(b.subarray(12, 28));
      return JSON.parse(
        Buffer.concat([c.update(b.subarray(28)), c.final()]).toString(),
      );
    } catch {
      throw new AppError(
        "STORAGE_RECOVERY",
        "Stored data could not be decrypted. It has not been replaced.",
        503,
      );
    }
  }
  read(id) {
    const row = this.db.prepare("SELECT payload FROM users WHERE id=?").get(id);
    if (!row) return fresh();
    const state = this.open(row.payload, id);
    requireThat(
      state.schema === 1 &&
        Number.isSafeInteger(state.revision) &&
        state.revision >= 0,
      "STORAGE_VERSION",
      "Stored account uses an unsupported version. It was not modified.",
      503,
    );
    return state;
  }
  all() {
    return this.db
      .prepare("SELECT id,payload FROM users")
      .all()
      .map((row) => ({ id: row.id, state: this.open(row.payload, row.id) }));
  }
  save(id, state) {
    this.db
      .prepare(
        "INSERT INTO users VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      )
      .run(id, this.seal(state, id));
  }
  assertToken(id, iat) {
    const row = this.db
      .prepare("SELECT deleted FROM tombstones WHERE id=?")
      .get(id);
    requireThat(
      !row || iat > row.deleted,
      "ACCOUNT_ERASED",
      "This authorization predates account erasure. Sign in and authorize again.",
      401,
    );
  }
  transact(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      this.db.exec("COMMIT");
      return value;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  change(id, expectedRevision, requestId, operation, fn) {
    return this.transact(() => {
      const state = this.read(id);
      const hash = digest(JSON.stringify(operation));
      const receipt = state.receipts.find((r) => r.id === requestId);
      if (receipt) {
        requireThat(
          receipt.hash === hash,
          "REQUEST_REUSED",
          "Use a fresh request ID for a different operation.",
          409,
        );
        return { state, replayed: true };
      }
      requireThat(
        state.revision === expectedRevision,
        "STALE_REVISION",
        "The record changed. Read it again before saving.",
        409,
      );
      fn(state);
      state.revision++;
      state.receipts.push({ id: requestId, hash, revision: state.revision });
      state.receipts = state.receipts.slice(-100);
      this.save(id, state);
      return { state, replayed: false };
    });
  }
  putTransient(kind, token, value, ttlSeconds) {
    this.cleanup();
    const id = digest(token);
    const context = `${kind}:${id}`;
    this.db
      .prepare("INSERT INTO transient VALUES (?,?,?,?)")
      .run(
        kind,
        id,
        this.seal(value, context),
        Math.floor(Date.now() / 1000) + ttlSeconds,
      );
  }
  transient(kind, token, consume = false) {
    this.cleanup();
    const id = digest(token || "");
    const row = this.db
      .prepare("SELECT payload FROM transient WHERE kind=? AND id=?")
      .get(kind, id);
    if (!row) return null;
    if (consume)
      this.db
        .prepare("DELETE FROM transient WHERE kind=? AND id=?")
        .run(kind, id);
    return this.open(row.payload, `${kind}:${id}`);
  }
  removeTransient(kind, token) {
    this.db
      .prepare("DELETE FROM transient WHERE kind=? AND id=?")
      .run(kind, digest(token || ""));
  }
  cleanup() {
    this.db
      .prepare("DELETE FROM transient WHERE expires<=?")
      .run(Math.floor(Date.now() / 1000));
  }
  erase(id, expectedRevision) {
    this.transact(() => {
      if (expectedRevision !== undefined)
        requireThat(
          this.read(id).revision === expectedRevision,
          "STALE_REVISION",
          "Reload before erasing changed data.",
          409,
        );
      this.db.prepare("DELETE FROM users WHERE id=?").run(id);
      // Minimal keyed tombstone prevents still-valid pre-erasure authorizations
      // from silently resurrecting data. Retained until operator key rotation.
      this.db
        .prepare(
          "INSERT INTO tombstones VALUES (?,?) ON CONFLICT(id) DO UPDATE SET deleted=excluded.deleted",
        )
        .run(id, Math.floor(Date.now() / 1000));
      for (const row of this.db
        .prepare("SELECT id,payload FROM transient WHERE kind='session'")
        .all()) {
        if (this.open(row.payload, `session:${row.id}`).id === id)
          this.db
            .prepare("DELETE FROM transient WHERE kind='session' AND id=?")
            .run(row.id);
      }
    });
  }
  close() {
    this.db.close();
  }
}
