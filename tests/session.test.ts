import { describe, expect, it } from "vitest";
import {
  createSession,
  isAbsolutelyExpired,
  isSessionExpired,
  refreshSession,
  sessionState,
  shouldRefresh,
  timeUntilExpiry,
  type SessionPolicy,
} from "@/lib/session";
import type { User } from "@/lib/auth";

const user: User = { id: "u1", email: "a@b.com" };
const policy: SessionPolicy = {
  accessTtlMs: 1_000,
  absoluteTtlMs: 10_000,
  refreshSkewMs: 200,
};

function makeSession(now: number) {
  return createSession(
    user,
    { accessToken: "at", refreshToken: "rt" },
    policy,
    () => now,
  );
}

describe("createSession", () => {
  it("sets expiry windows from the policy", () => {
    const session = makeSession(0);
    expect(session.expiresAt).toBe(1_000);
    expect(session.absoluteExpiresAt).toBe(10_000);
  });
});

describe("sessionState", () => {
  it("is active well before expiry", () => {
    const session = makeSession(0);
    expect(sessionState(session, policy, () => 500)).toBe("active");
  });

  it("is stale inside the refresh-skew window", () => {
    const session = makeSession(0);
    expect(sessionState(session, policy, () => 850)).toBe("stale");
  });

  it("is expired after the access TTL", () => {
    const session = makeSession(0);
    expect(sessionState(session, policy, () => 1_000)).toBe("expired");
  });
});

describe("isSessionExpired / isAbsolutelyExpired", () => {
  it("detects access-token expiry", () => {
    const session = makeSession(0);
    expect(isSessionExpired(session, () => 999)).toBe(false);
    expect(isSessionExpired(session, () => 1_000)).toBe(true);
  });

  it("detects absolute expiry", () => {
    const session = makeSession(0);
    expect(isAbsolutelyExpired(session, () => 9_999)).toBe(false);
    expect(isAbsolutelyExpired(session, () => 10_000)).toBe(true);
  });
});

describe("shouldRefresh", () => {
  it("is false while active", () => {
    const session = makeSession(0);
    expect(shouldRefresh(session, policy, () => 500)).toBe(false);
  });

  it("is true when stale", () => {
    const session = makeSession(0);
    expect(shouldRefresh(session, policy, () => 850)).toBe(true);
  });

  it("is false once the absolute lifetime is reached", () => {
    const session = makeSession(0);
    expect(shouldRefresh(session, policy, () => 10_001)).toBe(false);
  });
});

describe("refreshSession", () => {
  it("extends the access window but preserves absolute expiry", () => {
    const session = makeSession(0);
    const refreshed = refreshSession(
      session,
      { accessToken: "at2" },
      policy,
      () => 900,
    );
    expect(refreshed.accessToken).toBe("at2");
    expect(refreshed.expiresAt).toBe(1_900);
    expect(refreshed.absoluteExpiresAt).toBe(10_000);
  });

  it("clamps the new expiry to the absolute lifetime", () => {
    const session = makeSession(0);
    const refreshed = refreshSession(
      session,
      { accessToken: "at2" },
      policy,
      () => 9_500,
    );
    expect(refreshed.expiresAt).toBe(10_000);
  });

  it("rotates the refresh token when provided", () => {
    const session = makeSession(0);
    const refreshed = refreshSession(
      session,
      { accessToken: "at2", refreshToken: "rt2" },
      policy,
      () => 900,
    );
    expect(refreshed.refreshToken).toBe("rt2");
  });

  it("throws once the absolute lifetime is exceeded", () => {
    const session = makeSession(0);
    expect(() =>
      refreshSession(session, { accessToken: "at2" }, policy, () => 10_001),
    ).toThrow(/absolute lifetime/i);
  });
});

describe("timeUntilExpiry", () => {
  it("returns remaining ms, clamped at zero", () => {
    const session = makeSession(0);
    expect(timeUntilExpiry(session, () => 600)).toBe(400);
    expect(timeUntilExpiry(session, () => 5_000)).toBe(0);
  });
});
