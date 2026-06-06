/**
 * Session lifecycle logic: expiry checks, sliding-window refresh decisions,
 * and absolute-lifetime enforcement.
 *
 * Pure and clock-injectable so the rules can be unit-tested without timers and
 * reused on both client and server.
 */

import type { User } from "./auth";

/** A token-bearing session as the app sees it. */
export interface Session {
  user: User;
  /** Short-lived access token. */
  accessToken: string;
  /** Long-lived token used to mint new access tokens. */
  refreshToken: string;
  /** Epoch ms when the session was first created. */
  issuedAt: number;
  /** Epoch ms when the current access token expires. */
  expiresAt: number;
  /**
   * Epoch ms after which the session may no longer be refreshed at all
   * (absolute lifetime), forcing re-authentication.
   */
  absoluteExpiresAt: number;
}

export interface SessionPolicy {
  /** Access-token lifetime in ms. */
  accessTtlMs: number;
  /** Absolute session lifetime in ms (cap on sliding refresh). */
  absoluteTtlMs: number;
  /**
   * Refresh proactively once the access token is within this many ms of
   * expiring. Defaults to 20% of `accessTtlMs`.
   */
  refreshSkewMs?: number;
}

/** Sensible defaults: 15-minute access token, 7-day absolute lifetime. */
export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  accessTtlMs: 15 * 60 * 1000,
  absoluteTtlMs: 7 * 24 * 60 * 60 * 1000,
  refreshSkewMs: 3 * 60 * 1000,
};

export type SessionState = "active" | "stale" | "expired";

function skew(policy: SessionPolicy): number {
  return policy.refreshSkewMs ?? Math.floor(policy.accessTtlMs * 0.2);
}

/**
 * Create a brand-new session from issued tokens.
 */
export function createSession(
  user: User,
  tokens: { accessToken: string; refreshToken: string },
  policy: SessionPolicy = DEFAULT_SESSION_POLICY,
  now: () => number = Date.now,
): Session {
  const issuedAt = now();
  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    issuedAt,
    expiresAt: issuedAt + policy.accessTtlMs,
    absoluteExpiresAt: issuedAt + policy.absoluteTtlMs,
  };
}

/** True once the access token has fully expired. */
export function isSessionExpired(
  session: Session,
  now: () => number = Date.now,
): boolean {
  return now() >= session.expiresAt;
}

/** True once the absolute lifetime is reached — refresh is no longer allowed. */
export function isAbsolutelyExpired(
  session: Session,
  now: () => number = Date.now,
): boolean {
  return now() >= session.absoluteExpiresAt;
}

/**
 * Coarse session state:
 * - `expired`  : access token gone, needs refresh (or re-auth if absolute).
 * - `stale`    : still valid but inside the refresh-skew window.
 * - `active`   : fresh, no action needed.
 */
export function sessionState(
  session: Session,
  policy: SessionPolicy = DEFAULT_SESSION_POLICY,
  now: () => number = Date.now,
): SessionState {
  const t = now();
  if (t >= session.expiresAt) return "expired";
  if (t >= session.expiresAt - skew(policy)) return "stale";
  return "active";
}

/**
 * Decide whether a refresh should be attempted now. Refresh is warranted when
 * the token is stale or expired, AND the absolute lifetime has not been hit.
 */
export function shouldRefresh(
  session: Session,
  policy: SessionPolicy = DEFAULT_SESSION_POLICY,
  now: () => number = Date.now,
): boolean {
  if (isAbsolutelyExpired(session, now)) return false;
  const state = sessionState(session, policy, now);
  return state !== "active";
}

/**
 * Apply a successful refresh: extend the access-token window while preserving
 * the original absolute expiry. Throws if the session can no longer be
 * refreshed, so callers must route the user to re-authentication instead.
 */
export function refreshSession(
  session: Session,
  tokens: { accessToken: string; refreshToken?: string },
  policy: SessionPolicy = DEFAULT_SESSION_POLICY,
  now: () => number = Date.now,
): Session {
  if (isAbsolutelyExpired(session, now)) {
    throw new Error("Session has reached its absolute lifetime; re-authenticate.");
  }
  const t = now();
  return {
    ...session,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? session.refreshToken,
    expiresAt: Math.min(t + policy.accessTtlMs, session.absoluteExpiresAt),
  };
}

/** Milliseconds until the access token expires (clamped at 0). */
export function timeUntilExpiry(
  session: Session,
  now: () => number = Date.now,
): number {
  return Math.max(0, session.expiresAt - now());
}
