import { describe, expect, it } from "vitest";
import { getBearerToken } from "./auth.js";

describe("getBearerToken", () => {
  it("parses a valid bearer header", () => {
    expect(getBearerToken("Bearer token-value")).toBe("token-value");
  });

  it("rejects malformed headers", () => {
    expect(getBearerToken("token-value")).toBeNull();
    expect(getBearerToken(undefined)).toBeNull();
  });
});
