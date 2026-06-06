import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { AuthProvider, createFakeAuthClient, useAuth } from "@/lib/auth";
import { createMemoryTokenStore } from "@/lib/tokens";

function makeWrapper() {
  const store = createMemoryTokenStore();
  const client = createFakeAuthClient(store);
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(AuthProvider, { client, children });
  return { wrapper, client };
}

describe("password-reset flow", () => {
  it("issues a token, resets the password, and the new password logs in", async () => {
    const { wrapper, client } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: "reset@example.com",
        password: "OldPass12",
        name: "Reset User",
      });
    });

    let token = "";
    await act(async () => {
      const res = await result.current.requestPasswordReset("reset@example.com");
      token = res.token;
    });
    expect(token).toBeTruthy();

    await act(async () => {
      await result.current.resetPassword(token, "NewPass34");
    });

    // Old password now fails, new one succeeds (verified against the client).
    await expect(
      client.login({ email: "reset@example.com", password: "OldPass12" }),
    ).rejects.toThrow(/invalid/i);
    await expect(
      client.login({ email: "reset@example.com", password: "NewPass34" }),
    ).resolves.toMatchObject({ email: "reset@example.com" });
  });

  it("rejects a reused reset token", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: "once@example.com",
        password: "OldPass12",
      });
    });
    let token = "";
    await act(async () => {
      token = (await result.current.requestPasswordReset("once@example.com")).token;
    });
    await act(async () => {
      await result.current.resetPassword(token, "NewPass34");
    });
    await act(async () => {
      await expect(
        result.current.resetPassword(token, "Another56"),
      ).rejects.toThrow(/already been used/i);
    });
  });
});

describe("email-verification flow", () => {
  it("starts unverified and becomes verified after consuming the token", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: "verify@example.com",
        password: "OldPass12",
      });
    });
    expect(result.current.user?.emailVerified).toBe(false);

    let token = "";
    await act(async () => {
      token = (
        await result.current.requestEmailVerification("verify@example.com")
      ).token;
    });
    await act(async () => {
      await result.current.verifyEmail(token);
    });
    expect(result.current.user?.emailVerified).toBe(true);
  });

  it("rejects an invalid verification token", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await expect(result.current.verifyEmail("bogus")).rejects.toThrow(
        /invalid/i,
      );
    });
  });
});

describe("isAuthenticated flag", () => {
  it("reflects the presence of a user", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    await act(async () => {
      await result.current.login({
        email: "x@example.com",
        password: "Abcdef12",
      });
    });
    expect(result.current.isAuthenticated).toBe(true);
  });
});
