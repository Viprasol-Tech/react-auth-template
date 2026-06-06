"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { validatePassword, validatePasswordConfirm } from "@/lib/validation";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

export interface ResetPasswordFormProps {
  /** The reset token from the link the user followed. */
  token: string;
  /** Called after the password is successfully reset. */
  onSuccess?: () => void;
}

interface FieldErrors {
  password?: string;
  confirm?: string;
}

/**
 * Sets a new password using a reset token. Validates the new password against
 * the policy and confirms the two entries match before submitting.
 */
export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const { resetPassword, status, error } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) next.password = passwordResult.error ?? undefined;
    const confirmResult = validatePasswordConfirm(password, confirm);
    if (!confirmResult.valid) next.confirm = confirmResult.error ?? undefined;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      await resetPassword(token, password);
      setDone(true);
      onSuccess?.();
    } catch {
      // Surfaced via context error (invalid/expired/used token).
    }
  }

  const submitting = status === "loading";

  if (done) {
    return (
      <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
        Your password has been reset. You can now sign in.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Reset password form"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="reset-password"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          New password
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "reset-password-error" : undefined}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <PasswordStrengthMeter password={password} />
        {errors.password && (
          <p id="reset-password-error" role="alert" className="text-sm text-red-600">
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="reset-confirm"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? "reset-confirm-error" : undefined}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        {errors.confirm && (
          <p id="reset-confirm-error" role="alert" className="text-sm text-red-600">
            {errors.confirm}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Reset password"}
      </button>
    </form>
  );
}

export default ResetPasswordForm;
