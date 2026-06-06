"use client";

import { passwordStrengthDetailed } from "@/lib/validation";

export interface PasswordStrengthMeterProps {
  password: string;
  /** Show the list of improvement suggestions below the bar. */
  showSuggestions?: boolean;
}

const BAR_COLORS: Record<number, string> = {
  0: "bg-gray-300 dark:bg-gray-700",
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-emerald-500",
};

/**
 * Visual password-strength meter backed by {@link passwordStrengthDetailed}.
 * Renders a four-segment bar, a textual label, and (optionally) suggestions.
 */
export function PasswordStrengthMeter({
  password,
  showSuggestions = true,
}: PasswordStrengthMeterProps) {
  const strength = passwordStrengthDetailed(password);
  const segments = [1, 2, 3, 4];

  return (
    <div data-testid="password-strength" className="mt-1 flex flex-col gap-1">
      <div className="flex gap-1" aria-hidden>
        {segments.map((segment) => (
          <div
            key={segment}
            className={`h-1.5 flex-1 rounded transition-colors ${
              segment <= strength.score
                ? BAR_COLORS[strength.score]
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Strength: <span data-testid="strength-label">{strength.label}</span>
        {password.length > 0 && (
          <span className="ml-1 text-gray-400 dark:text-gray-500">
            (~{strength.entropyBits} bits)
          </span>
        )}
      </p>
      {showSuggestions && strength.suggestions.length > 0 && (
        <ul className="list-disc pl-4 text-xs text-gray-500 dark:text-gray-400">
          {strength.suggestions.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
