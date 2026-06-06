import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import {
  AuthProvider,
  createFakeAuthClient,
  useAuth,
  type User,
} from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  replace.mockClear();
});

function renderGuard(
  child: ReactNode,
  opts: { initialUser?: User | null; requireVerified?: boolean } = {},
) {
  return render(
    createElement(AuthProvider, {
      client: createFakeAuthClient(),
      initialUser: opts.initialUser ?? null,
      children: createElement(ProtectedRoute, {
        requireVerified: opts.requireVerified,
        fallback: createElement("p", {}, "redirecting"),
        children: child,
      }),
    }),
  );
}

describe("ProtectedRoute", () => {
  it("redirects an unauthenticated user to /login", () => {
    renderGuard(createElement("div", {}, "secret"));
    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(screen.getByText("redirecting")).toBeInTheDocument();
  });

  it("renders children for an authenticated user", () => {
    renderGuard(createElement("div", {}, "secret"), {
      initialUser: { id: "u1", email: "a@b.com", emailVerified: true },
    });
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects an unverified user when verification is required", () => {
    renderGuard(createElement("div", {}, "secret"), {
      initialUser: { id: "u1", email: "a@b.com", emailVerified: false },
      requireVerified: true,
    });
    expect(replace).toHaveBeenCalledWith("/verify-email");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("redirects after the user logs out", async () => {
    function LogoutButton() {
      const { logout } = useAuth();
      return createElement(
        "button",
        { onClick: () => void logout() },
        "logout",
      );
    }
    render(
      createElement(AuthProvider, {
        client: createFakeAuthClient(),
        initialUser: { id: "u1", email: "a@b.com", emailVerified: true },
        children: [
          createElement(LogoutButton, { key: "btn" }),
          createElement(ProtectedRoute, {
            key: "guard",
            fallback: createElement("p", {}, "redirecting"),
            children: createElement("div", {}, "secret"),
          }),
        ],
      }),
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
    await act(async () => {
      screen.getByText("logout").click();
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
