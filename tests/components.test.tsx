import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AuthProvider, createFakeAuthClient } from "@/lib/auth";
import { createMemoryTokenStore } from "@/lib/tokens";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { OAuthButtons } from "@/components/OAuthButtons";
import { presetProvider } from "@/lib/oauth";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

function withAuth(ui: ReactNode, store = createMemoryTokenStore()) {
  return render(
    createElement(AuthProvider, {
      client: createFakeAuthClient(store),
      children: ui,
    }),
  );
}

describe("PasswordStrengthMeter", () => {
  it("shows an empty label with no password", () => {
    render(createElement(PasswordStrengthMeter, { password: "" }));
    expect(screen.getByTestId("strength-label")).toHaveTextContent("empty");
  });

  it("shows a strong label and entropy for a strong password", () => {
    render(createElement(PasswordStrengthMeter, { password: "Gx9!qLm2$Vn7" }));
    expect(screen.getByTestId("strength-label")).toHaveTextContent("strong");
    expect(screen.getByText(/bits/)).toBeInTheDocument();
  });

  it("renders suggestions for a weak password", () => {
    render(createElement(PasswordStrengthMeter, { password: "abc" }));
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });
});

describe("ForgotPasswordForm", () => {
  it("validates the email before requesting", () => {
    withAuth(createElement(ForgotPasswordForm, {}));
    fireEvent.submit(screen.getByRole("form", { name: /forgot password/i }));
    expect(screen.getByText(/valid email|required/i)).toBeInTheDocument();
  });

  it("requests a reset and surfaces the demo token", async () => {
    const onSent = vi.fn();
    withAuth(createElement(ForgotPasswordForm, { onSent }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(screen.getByRole("form", { name: /forgot password/i }));
    await waitFor(() =>
      expect(screen.getByTestId("reset-token")).toBeInTheDocument(),
    );
    expect(onSent).toHaveBeenCalledTimes(1);
  });
});

describe("ResetPasswordForm", () => {
  it("validates the new password and confirmation", () => {
    withAuth(createElement(ResetPasswordForm, { token: "t" }));
    fireEvent.submit(screen.getByRole("form", { name: /reset password/i }));
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("rejects an invalid token and shows the error", async () => {
    withAuth(createElement(ResetPasswordForm, { token: "bogus" }));
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewPass34" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "NewPass34" },
    });
    fireEvent.submit(screen.getByRole("form", { name: /reset password/i }));
    await waitFor(() =>
      expect(screen.getByText(/invalid/i)).toBeInTheDocument(),
    );
  });
});

describe("OAuthButtons", () => {
  it("renders a button per provider and authorizes on click", () => {
    const onAuthorize = vi.fn();
    render(
      createElement(OAuthButtons, {
        providers: [
          presetProvider("google", "gid"),
          presetProvider("github", "ghid"),
        ],
        redirectUri: "https://app.example.com/cb",
        onAuthorize,
      }),
    );
    const googleBtn = screen.getByRole("button", { name: /google/i });
    fireEvent.click(googleBtn);
    expect(onAuthorize).toHaveBeenCalledTimes(1);
    const [url, state] = onAuthorize.mock.calls[0];
    expect(url).toContain("accounts.google.com");
    expect(state).toBeTruthy();
  });

  it("renders nothing with no providers", () => {
    const { container } = render(
      createElement(OAuthButtons, {
        providers: [],
        redirectUri: "https://app.example.com/cb",
      }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
