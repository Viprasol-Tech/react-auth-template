import { describe, expect, it } from "vitest";
import {
  consumeToken,
  createMemoryTokenStore,
  generateToken,
  isExpired,
  issueToken,
  verifyToken,
} from "@/lib/tokens";

/** Deterministic random source cycling through fixed values. */
function seededRandom(seed = 0.123456): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

describe("generateToken", () => {
  it("produces a string of the requested length", () => {
    expect(generateToken(16)).toHaveLength(16);
    expect(generateToken(40)).toHaveLength(40);
  });

  it("uses only URL-safe alphanumerics", () => {
    expect(generateToken(64)).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("is deterministic given a seeded random source", () => {
    expect(generateToken(20, seededRandom())).toBe(
      generateToken(20, seededRandom()),
    );
  });

  it("rejects a non-positive length", () => {
    expect(() => generateToken(0)).toThrow(/positive/i);
  });
});

describe("issueToken", () => {
  it("persists a token with the correct purpose and TTL", () => {
    const store = createMemoryTokenStore();
    const record = issueToken(store, "User@Example.com", "password-reset", {
      now: () => 1_000,
      ttlMs: 5_000,
    });
    expect(record.subject).toBe("user@example.com");
    expect(record.purpose).toBe("password-reset");
    expect(record.expiresAt).toBe(6_000);
    expect(record.consumedAt).toBeNull();
    expect(store.find(record.token)).toEqual(record);
  });

  it("invalidates previous tokens for the same subject + purpose by default", () => {
    const store = createMemoryTokenStore();
    const first = issueToken(store, "a@b.com", "email-verification");
    const second = issueToken(store, "a@b.com", "email-verification");
    expect(store.find(first.token)).toBeUndefined();
    expect(store.find(second.token)).toBeDefined();
  });

  it("keeps previous tokens when invalidatePrevious is false", () => {
    const store = createMemoryTokenStore();
    const first = issueToken(store, "a@b.com", "password-reset", {
      invalidatePrevious: false,
    });
    issueToken(store, "a@b.com", "password-reset", {
      invalidatePrevious: false,
    });
    expect(store.find(first.token)).toBeDefined();
  });

  it("rejects an empty subject", () => {
    const store = createMemoryTokenStore();
    expect(() => issueToken(store, "   ", "password-reset")).toThrow(/subject/i);
  });
});

describe("verifyToken", () => {
  it("returns not-found for an unknown token", () => {
    const store = createMemoryTokenStore();
    expect(verifyToken(store, "nope", "password-reset")).toEqual({
      ok: false,
      reason: "not-found",
    });
  });

  it("rejects a purpose mismatch", () => {
    const store = createMemoryTokenStore();
    const record = issueToken(store, "a@b.com", "password-reset");
    expect(verifyToken(store, record.token, "email-verification")).toEqual({
      ok: false,
      reason: "purpose-mismatch",
    });
  });

  it("rejects an expired token", () => {
    const store = createMemoryTokenStore();
    const record = issueToken(store, "a@b.com", "password-reset", {
      now: () => 0,
      ttlMs: 1_000,
    });
    const result = verifyToken(store, record.token, "password-reset", () => 2_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("accepts a valid, unexpired token", () => {
    const store = createMemoryTokenStore();
    const record = issueToken(store, "a@b.com", "password-reset", {
      now: () => 0,
      ttlMs: 1_000,
    });
    const result = verifyToken(store, record.token, "password-reset", () => 500);
    expect(result.ok).toBe(true);
  });
});

describe("consumeToken", () => {
  it("marks a token consumed so it cannot be reused", () => {
    const store = createMemoryTokenStore();
    const record = issueToken(store, "a@b.com", "password-reset", {
      now: () => 0,
      ttlMs: 10_000,
    });
    const first = consumeToken(store, record.token, "password-reset", () => 100);
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.record.consumedAt).toBe(100);

    const second = consumeToken(store, record.token, "password-reset", () => 200);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("consumed");
  });
});

describe("isExpired", () => {
  it("reports expiry relative to the given time", () => {
    const store = createMemoryTokenStore();
    const record = issueToken(store, "a@b.com", "password-reset", {
      now: () => 0,
      ttlMs: 1_000,
    });
    expect(isExpired(record, 500)).toBe(false);
    expect(isExpired(record, 1_000)).toBe(true);
  });
});
