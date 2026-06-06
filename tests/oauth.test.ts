import { describe, expect, it } from "vitest";
import {
  buildAuthorizationRequest,
  OAuthRegistry,
  parseCallback,
  presetProvider,
  verifyCallback,
  type OAuthProvider,
} from "@/lib/oauth";

const google = presetProvider("google", "client-123");

describe("presetProvider", () => {
  it("fills in known endpoints and scopes", () => {
    expect(google.authorizationUrl).toContain("accounts.google.com");
    expect(google.scopes).toContain("email");
    expect(google.clientId).toBe("client-123");
  });

  it("allows scope overrides", () => {
    const p = presetProvider("github", "abc", ["repo"]);
    expect(p.scopes).toEqual(["repo"]);
  });

  it("rejects an unknown preset", () => {
    expect(() =>
      presetProvider("myspace" as "google", "x"),
    ).toThrow(/unknown/i);
  });

  it("rejects an empty clientId", () => {
    expect(() => presetProvider("google", "  ")).toThrow(/clientId/i);
  });
});

describe("buildAuthorizationRequest", () => {
  it("builds a URL with required OAuth params", () => {
    const { url, state } = buildAuthorizationRequest(google, {
      redirectUri: "https://app.example.com/callback",
      state: "fixed-state",
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe("client-123");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "https://app.example.com/callback",
    );
    expect(parsed.searchParams.get("state")).toBe("fixed-state");
    expect(parsed.searchParams.get("scope")).toBe("openid email profile");
    expect(state).toBe("fixed-state");
  });

  it("generates a state when none is provided", () => {
    const { state } = buildAuthorizationRequest(google, {
      redirectUri: "https://app.example.com/callback",
    });
    expect(state.length).toBeGreaterThan(10);
  });

  it("merges extra params", () => {
    const { url } = buildAuthorizationRequest(google, {
      redirectUri: "https://app.example.com/callback",
      extraParams: { access_type: "offline", prompt: "consent" },
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("access_type")).toBe("offline");
    expect(parsed.searchParams.get("prompt")).toBe("consent");
  });

  it("rejects an empty redirectUri", () => {
    expect(() =>
      buildAuthorizationRequest(google, { redirectUri: "" }),
    ).toThrow(/redirectUri/i);
  });
});

describe("parseCallback", () => {
  it("parses code and state from a full URL", () => {
    const result = parseCallback(
      "https://app.example.com/cb?code=abc&state=xyz",
    );
    expect(result).toEqual({ ok: true, code: "abc", state: "xyz" });
  });

  it("parses a bare query string", () => {
    expect(parseCallback("code=abc&state=xyz")).toEqual({
      ok: true,
      code: "abc",
      state: "xyz",
    });
  });

  it("surfaces a provider error", () => {
    const result = parseCallback("?error=access_denied&state=xyz");
    expect(result).toEqual({ ok: false, error: "access_denied", state: "xyz" });
  });

  it("flags a missing code", () => {
    const result = parseCallback("state=xyz");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("missing_code");
  });
});

describe("verifyCallback", () => {
  it("accepts a matching state", () => {
    const result = verifyCallback("code=abc&state=xyz", "xyz");
    expect(result.ok).toBe(true);
  });

  it("rejects a mismatched state (CSRF protection)", () => {
    const result = verifyCallback("code=abc&state=evil", "xyz");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("state_mismatch");
  });
});

describe("OAuthRegistry", () => {
  it("registers, looks up, and lists providers", () => {
    const registry = new OAuthRegistry([google]);
    registry.register(presetProvider("github", "gh-id"));
    expect(registry.has("google")).toBe(true);
    expect(registry.get("github").clientId).toBe("gh-id");
    expect(registry.list()).toHaveLength(2);
  });

  it("throws on an unknown provider", () => {
    const registry = new OAuthRegistry();
    expect(() => registry.get("nope")).toThrow(/not registered/i);
  });

  it("rejects a provider with an empty id", () => {
    const bad = { ...google, id: "" } as OAuthProvider;
    expect(() => new OAuthRegistry().register(bad)).toThrow(/id/i);
  });
});
