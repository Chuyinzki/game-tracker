import { describe, expect, it } from "vitest";
import { createBacklogSchema, updateBacklogSchema } from "./validation.js";

describe("validation", () => {
  it("accepts a create payload with optional metadata", () => {
    expect(
      createBacklogSchema.parse({
        gameId: 42,
        name: "Elden Ring",
        status: "playing"
      })
    ).toMatchObject({
      gameId: 42,
      name: "Elden Ring",
      status: "playing"
    });
  });

  it("rejects empty updates", () => {
    expect(() => updateBacklogSchema.parse({})).toThrowError();
  });
});
