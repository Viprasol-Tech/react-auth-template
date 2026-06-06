"use client";

import { useTheme } from "@/lib/theme";

/**
 * A small light/dark toggle button. Reflects and updates the active theme via
 * the {@link useTheme} context.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}

export default ThemeToggle;
