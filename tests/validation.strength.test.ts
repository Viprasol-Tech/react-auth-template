import { describe, expect, it } from "vitest";
import {
  estimateEntropyBits,
  isCommonPassword,
  passwordStrengthDetailed,
  validatePassword,
} from "@/lib/validation";

describe("estimateEntropyBits", () => {
  it("is zero for an empty password", () => {
    expect(estimateEntropyBits("")).toBe(0);
  });

  it("grows with length and character variety", () => {
    const short = estimateEntropyBits("abcd");
    const longer = estimateEntropyBits("abcdefghij");
    const varied = estimateEntropyBits("aB3!aB3!aB");
    expect(longer).toBeGreaterThan(short);
    expect(varied).toBeGreaterThan(longer);
  });
});

describe("isCommonPassword", () => {
  it("flags blocklisted passwords case-insensitively", () => {
    expect(isCommonPassword("Password123")).toBe(true);
    expect(isCommonPassword("letmein")).toBe(true);
  });

  it("does not flag uncommon passwords", () => {
    expect(isCommonPassword("Tr0ub4dor&3xy")).toBe(false);
  });
});

describe("passwordStrengthDetailed", () => {
  it("marks empty as score 0 / empty", () => {
    const r = passwordStrengthDetailed("");
    expect(r.score).toBe(0);
    expect(r.label).toBe("empty");
  });

  it("forces a common password to score 0", () => {
    const r = passwordStrengthDetailed("password123");
    expect(r.common).toBe(true);
    expect(r.score).toBe(0);
    expect(r.suggestions).toContain("Avoid common, easily-guessed passwords.");
  });

  it("penalizes repeated characters", () => {
    const r = passwordStrengthDetailed("Aaaaaaa1!");
    expect(r.repeated).toBe(true);
    expect(r.suggestions).toContain("Avoid repeating the same character.");
  });

  it("penalizes sequential runs", () => {
    const r = passwordStrengthDetailed("abcd1234EF");
    expect(r.sequential).toBe(true);
  });

  it("rates a strong, high-entropy password as strong", () => {
    const r = passwordStrengthDetailed("Gx9!qLm2$Vn7");
    expect(r.label).toBe("strong");
    expect(r.score).toBe(4);
    expect(r.suggestions).toHaveLength(0);
  });

  it("emits targeted suggestions for missing classes", () => {
    const r = passwordStrengthDetailed("abcdefg");
    expect(r.suggestions).toContain("Use at least 8 characters.");
    expect(r.suggestions).toContain("Add an uppercase letter.");
    expect(r.suggestions).toContain("Add a number.");
  });
});

describe("validatePassword (common-password rejection)", () => {
  it("rejects a policy-compliant but common password", () => {
    // "Passw0rd" passes length/case/number but matches the blocklist.
    expect(validatePassword("Passw0rd").valid).toBe(false);
    expect(validatePassword("Passw0rd").error).toMatch(/too common/i);
  });

  it("still accepts a strong unique password", () => {
    expect(validatePassword("Gx9qLm2Vn7").valid).toBe(true);
  });
});
