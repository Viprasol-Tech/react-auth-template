import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { AuthProvider, createFakeAuthClient, useAuth } from "@/lib/auth";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, { client: createFakeAuthClient(), children });
}

describe("useAuth", () => {
  it("starts with no user", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe("idle");
  });

  it("login sets the user, logout clears it", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: "user@example.com",
        password: "Abcdef12",
      });
    });
    expect(result.current.user?.email).toBe("user@example.com");

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();
  });

  it("register creates a user and rejects duplicates", async () => {
    const client = createFakeAuthClient();
    const localWrapper = ({ children }: { children: ReactNode }) =>
      createElement(AuthProvider, { client, children });
    const { result } = renderHook(() => useAuth(), { wrapper: localWrapper });

    await act(async () => {
      await result.current.register({
        email: "new@example.com",
        password: "Abcdef12",
        name: "New User",
      });
    });
    expect(result.current.user?.name).toBe("New User");

    await act(async () => {
      await expect(
        result.current.register({
          email: "new@example.com",
          password: "Abcdef12",
        }),
      ).rejects.toThrow(/already exists/i);
    });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatch(/already exists/i);
  });

  it("throws when used outside a provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});
