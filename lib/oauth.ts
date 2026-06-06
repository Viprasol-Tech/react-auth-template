/**
 * Provider-agnostic OAuth 2.0 / OIDC helpers.
 *
 * This module builds authorization-request URLs, generates and verifies the
 * anti-CSRF `state` parameter, and parses the redirect callback. It is
 * transport-free (no `fetch`), so the same code runs on the server, in an edge
 * handler, or under test. Token exchange is left to the caller, who knows their
 * own client secret and runtime.
 */

import { generateToken } from "./tokens";

/** A registered OAuth provider configuration. */
export interface OAuthProvider {
  /** Stable identifier, e.g. "google", "github". */
  id: string;
  /** Human label for buttons, e.g. "Continue with Google". */
  label: string;
  /** Provider authorization endpoint. */
  authorizationUrl: string;
  /** Provider token endpoint (used by the caller for code exchange). */
  tokenUrl: string;
  /** Public client identifier. */
  clientId: string;
  /** Default scopes requested if none are passed per-call. */
  scopes: string[];
}

/** Options for building an authorization URL. */
export interface AuthorizationRequestOptions {
  /** Where the provider redirects after consent. */
  redirectUri: string;
  /** Opaque anti-CSRF value; generated if omitted. */
  state?: string;
  /** Override the provider's default scopes. */
  scopes?: string[];
  /** Extra provider-specific query params (e.g. `prompt`, `access_type`). */
  extraParams?: Record<string, string>;
  /** Injectable randomness for the generated `state`. */
  random?: () => number;
}

/** The result of building an authorization request. */
export interface AuthorizationRequest {
  /** Fully-formed URL to redirect the user to. */
  url: string;
  /** The `state` value to persist and check on the callback. */
  state: string;
}

const KNOWN_PROVIDERS: Record<string, Omit<OAuthProvider, "clientId">> = {
  google: {
    id: "google",
    label: "Continue with Google",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "profile"],
  },
  github: {
    id: "github",
    label: "Continue with GitHub",
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["read:user", "user:email"],
  },
};

/**
 * Build a provider config from a well-known preset, supplying only the
 * client id (and optionally overriding scopes).
 */
export function presetProvider(
  id: keyof typeof KNOWN_PROVIDERS,
  clientId: string,
  scopes?: string[],
): OAuthProvider {
  const base = KNOWN_PROVIDERS[id];
  if (!base) {
    throw new Error(`Unknown OAuth provider preset: ${String(id)}`);
  }
  if (clientId.trim().length === 0) {
    throw new Error("clientId is required.");
  }
  return { ...base, clientId, scopes: scopes ?? base.scopes };
}

/** A simple registry that holds the providers an app supports. */
export class OAuthRegistry {
  private readonly providers = new Map<string, OAuthProvider>();

  constructor(initial: OAuthProvider[] = []) {
    for (const p of initial) this.register(p);
  }

  register(provider: OAuthProvider): this {
    if (provider.id.trim().length === 0) {
      throw new Error("Provider id is required.");
    }
    this.providers.set(provider.id, provider);
    return this;
  }

  get(id: string): OAuthProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`OAuth provider not registered: ${id}`);
    }
    return provider;
  }

  has(id: string): boolean {
    return this.providers.has(id);
  }

  list(): OAuthProvider[] {
    return [...this.providers.values()];
  }
}

/**
 * Build a complete authorization-request URL for the given provider. Returns
 * both the URL and the `state` so the caller can persist `state` for later
 * verification on the callback.
 */
export function buildAuthorizationRequest(
  provider: OAuthProvider,
  options: AuthorizationRequestOptions,
): AuthorizationRequest {
  if (options.redirectUri.trim().length === 0) {
    throw new Error("redirectUri is required.");
  }
  const state = options.state ?? generateToken(24, options.random);
  const scopes = options.scopes ?? provider.scopes;

  const url = new URL(provider.authorizationUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", provider.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  for (const [key, value] of Object.entries(options.extraParams ?? {})) {
    url.searchParams.set(key, value);
  }

  return { url: url.toString(), state };
}

/** Parsed contents of a provider redirect callback. */
export type CallbackResult =
  | { ok: true; code: string; state: string }
  | { ok: false; error: string; state: string | null };

/**
 * Parse a callback URL (or query string) into a code + state, surfacing any
 * `error` the provider returned. Use {@link verifyCallback} to also check the
 * stored state.
 */
export function parseCallback(input: string): CallbackResult {
  const params = toSearchParams(input);
  const state = params.get("state");
  const error = params.get("error");
  if (error) {
    return { ok: false, error, state };
  }
  const code = params.get("code");
  if (!code) {
    return { ok: false, error: "missing_code", state };
  }
  if (!state) {
    return { ok: false, error: "missing_state", state: null };
  }
  return { ok: true, code, state };
}

/**
 * Parse a callback and verify its `state` against the value persisted before
 * the redirect. Mismatched or missing state is rejected to prevent CSRF.
 */
export function verifyCallback(
  input: string,
  expectedState: string,
): CallbackResult {
  const parsed = parseCallback(input);
  if (!parsed.ok) {
    return parsed;
  }
  if (parsed.state !== expectedState) {
    return { ok: false, error: "state_mismatch", state: parsed.state };
  }
  return parsed;
}

function toSearchParams(input: string): URLSearchParams {
  // Accept a full URL, a "?a=b" string, or a bare "a=b" query string.
  if (input.includes("://")) {
    return new URL(input).searchParams;
  }
  return new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
}
