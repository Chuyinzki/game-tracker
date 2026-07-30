import { randomUUID } from "node:crypto";
import type { BacklogStatus } from "@prisma/client";

export const RABBITMQ_EXCHANGE = "backlog.events";

export type BacklogEventType = "backlog.item.created" | "backlog.item.updated";

export type BacklogEntrySnapshot = {
  id: string;
  gameId: number;
  gameName: string;
  coverUrl: string | null;
  releaseYear: number | null;
  status: BacklogStatus;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
};

export type BacklogEvent = {
  eventId: string;
  type: BacklogEventType;
  occurredAt: string;
  userId: string;
  backlogEntry: BacklogEntrySnapshot;
};

export function buildBacklogEvent(
  type: BacklogEventType,
  userId: string,
  backlogEntry: BacklogEntrySnapshot
): BacklogEvent {
  return {
    eventId: randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    userId,
    backlogEntry
  };
}
