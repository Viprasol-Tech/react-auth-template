import { describe, expect, it } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import {
  ThemeProvider,
  resolveInitialTheme,
  useTheme,
} from "@/lib/theme";
import { ThemeToggle } from "@/components/ThemeToggle";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ThemeProvider, { defaultTheme: "light", children });
}

describe("resolveInitialTheme", () => {
  it("prefers a valid stored value", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
    expect(resolveInitialTheme("light", true)).toBe("light");
  });

  it("falls back to OS preference when unset", () => {
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme(null, false)).toBe("light");
    expect(resolveInitialTheme("garbage", true)).toBe("dark");
  });
});

describe("useTheme", () => {
  it("toggles and sets the theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
  });

  it("reflects the dark class on <html>", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    act(() => result.current.setTheme("light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("throws outside a provider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });
});

describe("ThemeToggle", () => {
  it("renders and toggles the label on click", () => {
    render(
      createElement(ThemeProvider, {
        defaultTheme: "light",
        children: createElement(ThemeToggle),
      }),
    );
    const button = screen.getByRole("button", { name: /switch to dark/i });
    expect(button).toHaveAttribute("aria-pressed", "false");
    act(() => button.click());
    expect(
      screen.getByRole("button", { name: /switch to light/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
