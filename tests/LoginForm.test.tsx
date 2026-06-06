import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AuthProvider, createFakeAuthClient } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

function renderWithProvider(ui: ReactNode) {
  return render(
    createElement(AuthProvider, { client: createFakeAuthClient(), children: ui }),
  );
}

describe("LoginForm", () => {
  it("shows validation errors for empty fields and does not call onSuccess", () => {
    const onSuccess = vi.fn();
    renderWithProvider(createElement(LoginForm, { onSuccess }));

    fireEvent.submit(screen.getByRole("form", { name: /login form/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid email", () => {
    renderWithProvider(createElement(LoginForm, {}));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Abcdef12" },
    });
    fireEvent.submit(screen.getByRole("form", { name: /login form/i }));

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
  });

  it("submits valid credentials and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    renderWithProvider(createElement(LoginForm, { onSuccess }));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Abcdef12" },
    });
    fireEvent.submit(screen.getByRole("form", { name: /login form/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
