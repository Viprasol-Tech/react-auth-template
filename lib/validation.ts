/**
 * Form validation helpers for the auth template.
 *
 * These are pure functions with no React/DOM dependency so they can be reused
 * on the server, in edge handlers, or unit-tested in isolation.
 */

export interface FieldResult {
  /** Whether the value passed all checks. */
  valid: boolean;
  /** Human-readable error, or null when valid. */
  error: string | null;
}

export interface PasswordStrength {
  /** Score from 0 (empty) to 4 (very strong). */
  score: number;
  /** Coarse label derived from the score. */
  label: "empty" | "weak" | "fair" | "good" | "strong";
  /** Individual rule outcomes, useful for checklist UIs. */
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

// Pragmatic email pattern: one local part, one @, a dotted domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address. Trims surrounding whitespace before testing.
 */
export function validateEmail(raw: string): FieldResult {
  const value = raw.trim();
  if (value.length === 0) {
    return { valid: false, error: "Email is required." };
  }
  if (value.length > 254) {
    return { valid: false, error: "Email is too long." };
  }
  if (!EMAIL_RE.test(value)) {
    return { valid: false, error: "Enter a valid email address." };
  }
  return { valid: true, error: null };
}

/**
 * Evaluate individual password rules and produce an aggregate strength score.
 */
export function passwordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  if (password.length === 0) {
    return { score: 0, label: "empty", checks };
  }

  // Count satisfied character-class rules, capped at 4.
  const classes =
    Number(checks.lowercase) +
    Number(checks.uppercase) +
    Number(checks.number) +
    Number(checks.symbol);

  let score = classes;
  // Without the minimum length, the password can never be more than "fair".
  if (!checks.length) {
    score = Math.min(score, 2);
  }
  score = Math.max(0, Math.min(4, score));

  const label: PasswordStrength["label"] =
    score <= 1 ? "weak" : score === 2 ? "fair" : score === 3 ? "good" : "strong";

  return { score, label, checks };
}

/**
 * Validate a password against the minimum acceptance policy: at least 8
 * characters with a lowercase letter, an uppercase letter, and a number.
 */
export function validatePassword(password: string): FieldResult {
  if (password.length === 0) {
    return { valid: false, error: "Password is required." };
  }
  const { checks } = passwordStrength(password);
  if (!checks.length) {
    return { valid: false, error: "Password must be at least 8 characters." };
  }
  if (!checks.lowercase || !checks.uppercase) {
    return {
      valid: false,
      error: "Password must include upper and lower case letters.",
    };
  }
  if (!checks.number) {
    return { valid: false, error: "Password must include a number." };
  }
  return { valid: true, error: null };
}

/**
 * Confirm two password entries match. Empty confirmation is treated as missing.
 */
export function validatePasswordConfirm(
  password: string,
  confirm: string,
): FieldResult {
  if (confirm.length === 0) {
    return { valid: false, error: "Please confirm your password." };
  }
  if (password !== confirm) {
    return { valid: false, error: "Passwords do not match." };
  }
  return { valid: true, error: null };
}
