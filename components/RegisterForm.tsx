"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/validation";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

export interface RegisterFormProps {
  /** Called after a successful registration. */
  onSuccess?: () => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

/**
 * Controlled registration form with inline validation and a live password
 * strength meter. Submits through `useAuth`.
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, status, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (name.trim().length === 0) next.name = "Name is required.";
    const emailResult = validateEmail(email);
    if (!emailResult.valid) next.email = emailResult.error ?? undefined;
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
      await register({ email, password, name: name.trim() });
      onSuccess?.();
    } catch {
      // Surfaced via the `error` value from the auth context.
    }
  }

  const submitting = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Register form"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-name" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Name
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "reg-name-error" : undefined}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        {errors.name && (
          <p id="reg-name-error" role="alert" className="text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reg-email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "reg-email-error" : undefined}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        {errors.email && (
          <p id="reg-email-error" role="alert" className="text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="reg-password"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "reg-password-error" : undefined}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <PasswordStrengthMeter password={password} />
        {errors.password && (
          <p
            id="reg-password-error"
            role="alert"
            className="text-sm text-red-600"
          >
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="reg-confirm"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Confirm password
        </label>
        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? "reg-confirm-error" : undefined}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        {errors.confirm && (
          <p
            id="reg-confirm-error"
            role="alert"
            className="text-sm text-red-600"
          >
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
        {submitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

export default RegisterForm;
