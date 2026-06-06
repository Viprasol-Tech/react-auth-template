/**
 * Single-use, time-limited token logic for password-reset and
 * email-verification flows.
 *
 * The store is an in-memory `TokenStore` by default so the template runs with
 * no infrastructure, but the interface is small enough to back with Redis,
 * a database table, or a KV namespace in production. All functions are pure
 * with respect to the store and accept an injectable `now`/`random` so the
 * behaviour is fully deterministic under test.
 */

/** The kind of action a token authorizes. */
export type TokenPurpose = "password-reset" | "email-verification";

/** A persisted token record. */
export interface TokenRecord {
  /** Opaque token string handed to the user (e.g. emailed in a link). */
  token: string;
  /** Account the token belongs to (typically a normalized email). */
  subject: string;
  /** What the token is allowed to do. */
  purpose: TokenPurpose;
  /** Epoch milliseconds when the token was issued. */
  issuedAt: number;
  /** Epoch milliseconds after which the token is no longer valid. */
  expiresAt: number;
  /** Epoch milliseconds when the token was consumed, or null if unused. */
  consumedAt: number | null;
}

/** Pluggable persistence contract for tokens. */
export interface TokenStore {
  save(record: TokenRecord): void;
  find(token: string): TokenRecord | undefined;
  remove(token: string): void;
  /** Drop every token issued for a subject + purpose (e.g. on reissue). */
  removeBySubject(subject: string, purpose: TokenPurpose): void;
}

/** Result of attempting to verify or consume a token. */
export type TokenVerification =
  | { ok: true; record: TokenRecord }
  | { ok: false; reason: "not-found" | "expired" | "consumed" | "purpose-mismatch" };

/** Why a verification failed, mapped to a human-readable message. */
export const TOKEN_ERROR_MESSAGES: Record<
  Exclude<Extract<TokenVerification, { ok: false }>["reason"], never>,
  string
> = {
  "not-found": "This link is invalid.",
  expired: "This link has expired. Please request a new one.",
  consumed: "This link has already been used.",
  "purpose-mismatch": "This link cannot be used here.",
};

/** Default time-to-live per purpose, in milliseconds. */
export const DEFAULT_TTL_MS: Record<TokenPurpose, number> = {
  "password-reset": 60 * 60 * 1000, // 1 hour
  "email-verification": 24 * 60 * 60 * 1000, // 24 hours
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a URL-safe random token. Uses the supplied `random` (defaults to
 * `Math.random`) so tests can inject a deterministic source.
 */
export function generateToken(
  length = 32,
  random: () => number = Math.random,
): string {
  if (length <= 0) {
    throw new Error("Token length must be a positive integer.");
  }
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(random() * ALPHABET.length) % ALPHABET.length;
    out += ALPHABET[index];
  }
  return out;
}

/** Create an in-memory token store. */
export function createMemoryTokenStore(): TokenStore {
  const records = new Map<string, TokenRecord>();
  return {
    save(record) {
      records.set(record.token, record);
    },
    find(token) {
      return records.get(token);
    },
    remove(token) {
      records.delete(token);
    },
    removeBySubject(subject, purpose) {
      for (const [token, record] of records) {
        if (record.subject === subject && record.purpose === purpose) {
          records.delete(token);
        }
      }
    },
  };
}

export interface IssueOptions {
  /** Override the default TTL for this purpose, in milliseconds. */
  ttlMs?: number;
  /** Injectable clock for tests; defaults to `Date.now`. */
  now?: () => number;
  /** Injectable randomness for the token string. */
  random?: () => number;
  /**
   * When true (the default), any previous unconsumed tokens for the same
   * subject + purpose are invalidated so only the newest link works.
   */
  invalidatePrevious?: boolean;
}

/**
 * Issue a fresh token for a subject + purpose and persist it to the store.
 */
export function issueToken(
  store: TokenStore,
  subject: string,
  purpose: TokenPurpose,
  options: IssueOptions = {},
): TokenRecord {
  const normalized = subject.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new Error("A subject is required to issue a token.");
  }
  const now = options.now ?? Date.now;
  const issuedAt = now();
  const ttl = options.ttlMs ?? DEFAULT_TTL_MS[purpose];
  if (ttl <= 0) {
    throw new Error("Token TTL must be greater than zero.");
  }

  if (options.invalidatePrevious ?? true) {
    store.removeBySubject(normalized, purpose);
  }

  const record: TokenRecord = {
    token: generateToken(32, options.random),
    subject: normalized,
    purpose,
    issuedAt,
    expiresAt: issuedAt + ttl,
    consumedAt: null,
  };
  store.save(record);
  return record;
}

/**
 * Check a token without mutating it. Validates existence, purpose, expiry,
 * and prior consumption.
 */
export function verifyToken(
  store: TokenStore,
  token: string,
  purpose: TokenPurpose,
  now: () => number = Date.now,
): TokenVerification {
  const record = store.find(token);
  if (!record) {
    return { ok: false, reason: "not-found" };
  }
  if (record.purpose !== purpose) {
    return { ok: false, reason: "purpose-mismatch" };
  }
  if (record.consumedAt !== null) {
    return { ok: false, reason: "consumed" };
  }
  if (now() >= record.expiresAt) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, record };
}

/**
 * Verify and atomically mark a token consumed. A consumed token can never be
 * reused, which is what makes reset/verification links single-use.
 */
export function consumeToken(
  store: TokenStore,
  token: string,
  purpose: TokenPurpose,
  now: () => number = Date.now,
): TokenVerification {
  const result = verifyToken(store, token, purpose, now);
  if (!result.ok) {
    return result;
  }
  const consumed: TokenRecord = { ...result.record, consumedAt: now() };
  store.save(consumed);
  return { ok: true, record: consumed };
}

/** Convenience helper: true if the record is past its expiry at `at`. */
export function isExpired(record: TokenRecord, at: number = Date.now()): boolean {
  return at >= record.expiresAt;
}
