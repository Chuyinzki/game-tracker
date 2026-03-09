import { describe, expect, it } from "vitest";
import { buildStats } from "./stats.js";

describe("buildStats", () => {
  it("fills in missing statuses and rounds avg rating", () => {
    const result = buildStats(
      [
        { status: "completed", _count: { status: 3 } },
        { status: "playing", _count: { status: 1 } }
      ],
      8.149
    );

    expect(result).toEqual({
      want_to_play: 0,
      playing: 1,
      completed: 3,
      abandoned: 0,
      avgRating: 8.1
    });
  });
});
