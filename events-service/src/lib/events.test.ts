import { describe, expect, it } from "vitest";
import { summarizeEvent } from "./events.js";

describe("summarizeEvent", () => {
  it("extracts a compact event summary", () => {
    const summary = summarizeEvent({
      eventId: "event-1",
      type: "backlog.item.created",
      occurredAt: "2026-07-29T19:00:00.000Z",
      userId: "user-1",
      backlogEntry: {
        id: "entry-1",
        gameId: 42,
        gameName: "Control",
        coverUrl: null,
        releaseYear: 2019,
        status: "completed",
        rating: 10,
        createdAt: "2026-07-29T19:00:00.000Z",
        updatedAt: "2026-07-29T19:00:00.000Z"
      }
    });

    expect(summary).toEqual({
      eventId: "event-1",
      type: "backlog.item.created",
      occurredAt: "2026-07-29T19:00:00.000Z",
      userId: "user-1",
      gameName: "Control",
      status: "completed",
      rating: 10
    });
  });
});
