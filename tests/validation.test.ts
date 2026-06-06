import { describe, expect, it } from "vitest";
import {
  passwordStrength,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/validation";

describe("validateEmail", () => {
  it("accepts a well-formed address (trimming whitespace)", () => {
    expect(validateEmail("  user@example.com  ")).toEqual({
      valid: true,
      error: null,
    });
  });

  it("rejects an empty value", () => {
    const result = validateEmail("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it.each(["plainaddress", "missing@domain", "@no-local.com", "spaces in@x.com"])(
    "rejects malformed address %s",
    (value) => {
      expect(validateEmail(value).valid).toBe(false);
    },
  );
});

describe("passwordStrength", () => {
  it("scores an empty password as 0/empty", () => {
    const result = passwordStrength("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("empty");
  });

  it("caps short passwords at fair even with many classes", () => {
    const result = passwordStrength("Aa1!");
    expect(result.checks.length).toBe(false);
    expect(result.score).toBeLessThanOrEqual(2);
  });

  it("rates a long mixed password as strong", () => {
    const result = passwordStrength("Abcdef1!");
    expect(result.checks.length).toBe(true);
    expect(result.score).toBe(4);
    expect(result.label).toBe("strong");
  });
});

describe("validatePassword", () => {
  it("accepts a compliant password", () => {
    expect(validatePassword("Abcdef12").valid).toBe(true);
  });

  it("requires a minimum length", () => {
    expect(validatePassword("Ab1").error).toMatch(/8 characters/i);
  });

  it("requires mixed case", () => {
    expect(validatePassword("abcdef12").error).toMatch(/upper and lower/i);
  });

  it("requires a number", () => {
    expect(validatePassword("Abcdefgh").error).toMatch(/number/i);
  });
});

describe("validatePasswordConfirm", () => {
  it("passes when both match", () => {
    expect(validatePasswordConfirm("Abcdef12", "Abcdef12").valid).toBe(true);
  });

  it("fails when confirmation is empty", () => {
    expect(validatePasswordConfirm("Abcdef12", "").valid).toBe(false);
  });

  it("fails when they differ", () => {
    expect(validatePasswordConfirm("Abcdef12", "Abcdef13").error).toMatch(
      /do not match/i,
    );
  });
});
