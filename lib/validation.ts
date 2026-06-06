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

/** A small list of widely-leaked passwords we always reject. */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "letmein",
  "iloveyou",
  "admin123",
  "welcome1",
  "abc12345",
  "passw0rd",
]);

export interface StrengthDetail extends PasswordStrength {
  /** Estimated entropy in bits (rough, character-pool based). */
  entropyBits: number;
  /** Whether the password matches a known-leaked common password. */
  common: boolean;
  /** Whether the password contains a long run of repeated characters. */
  repeated: boolean;
  /** Whether the password contains a sequential run (e.g. "abcd", "1234"). */
  sequential: boolean;
  /** Actionable suggestions to strengthen the password. */
  suggestions: string[];
}

/** Size of the character pool the password draws from. */
function charPoolSize(password: string): number {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;
  return pool;
}

/** Rough Shannon-style entropy estimate: length * log2(poolSize). */
export function estimateEntropyBits(password: string): number {
  const pool = charPoolSize(password);
  if (pool === 0 || password.length === 0) return 0;
  return Math.round(password.length * Math.log2(pool));
}

/** Detect a run of >= `min` identical characters. */
function hasRepeatRun(password: string, min = 3): boolean {
  let run = 1;
  for (let i = 1; i < password.length; i += 1) {
    run = password[i] === password[i - 1] ? run + 1 : 1;
    if (run >= min) return true;
  }
  return false;
}

/** Detect an ascending or descending sequence of >= `min` characters. */
function hasSequentialRun(password: string, min = 4): boolean {
  const lower = password.toLowerCase();
  let asc = 1;
  let desc = 1;
  for (let i = 1; i < lower.length; i += 1) {
    const delta = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    asc = delta === 1 ? asc + 1 : 1;
    desc = delta === -1 ? desc + 1 : 1;
    if (asc >= min || desc >= min) return true;
  }
  return false;
}

/** True if the password is on the common-password blocklist. */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

/**
 * A stronger, entropy-aware strength meter. It builds on {@link passwordStrength}
 * but additionally penalizes common passwords, repeated characters, and
 * sequential runs, and emits concrete improvement suggestions.
 */
export function passwordStrengthDetailed(password: string): StrengthDetail {
  const base = passwordStrength(password);
  const entropyBits = estimateEntropyBits(password);
  const common = isCommonPassword(password);
  const repeated = hasRepeatRun(password);
  const sequential = hasSequentialRun(password);

  let score = base.score;
  // Reward genuinely high-entropy passwords.
  if (entropyBits >= 60 && base.checks.length) {
    score = Math.max(score, 4);
  }
  // Penalize weak patterns.
  if (repeated || sequential) score -= 1;
  if (common) score = 0;
  score = Math.max(0, Math.min(4, score));

  const label: PasswordStrength["label"] =
    password.length === 0
      ? "empty"
      : score <= 1
        ? "weak"
        : score === 2
          ? "fair"
          : score === 3
            ? "good"
            : "strong";

  const suggestions: string[] = [];
  if (!base.checks.length) suggestions.push("Use at least 8 characters.");
  if (!base.checks.uppercase) suggestions.push("Add an uppercase letter.");
  if (!base.checks.lowercase) suggestions.push("Add a lowercase letter.");
  if (!base.checks.number) suggestions.push("Add a number.");
  if (!base.checks.symbol) suggestions.push("Add a symbol for extra strength.");
  if (common) suggestions.push("Avoid common, easily-guessed passwords.");
  if (repeated) suggestions.push("Avoid repeating the same character.");
  if (sequential) suggestions.push("Avoid sequences like \"abcd\" or \"1234\".");

  return {
    score,
    label,
    checks: base.checks,
    entropyBits,
    common,
    repeated,
    sequential,
    suggestions,
  };
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
  if (isCommonPassword(password)) {
    return { valid: false, error: "This password is too common." };
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
