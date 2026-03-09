import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth.js";

describe("auth helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("test-password");

    expect(hash).not.toBe("test-password");
    await expect(verifyPassword("test-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
