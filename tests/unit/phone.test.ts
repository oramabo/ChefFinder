import { describe, it, expect } from "vitest";
import { normalizeIlPhone, samePhone } from "../../functions-lib/phone.ts";

describe("normalizeIlPhone", () => {
  it("canonicalizes the common Israeli formats to 972…", () => {
    expect(normalizeIlPhone("0501234567")).toBe("972501234567");
    expect(normalizeIlPhone("050-123 4567")).toBe("972501234567");
    expect(normalizeIlPhone("+972501234567")).toBe("972501234567");
    expect(normalizeIlPhone("00972501234567")).toBe("972501234567");
    expect(normalizeIlPhone("972501234567")).toBe("972501234567");
  });

  it("samePhone matches across formats", () => {
    expect(samePhone("050-123-4567", "+972 50 123 4567")).toBe(true);
    expect(samePhone("0501234567", "0507654321")).toBe(false);
  });
});
