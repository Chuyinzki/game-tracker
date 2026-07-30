export const RABBITMQ_EXCHANGE = "backlog.events";
export const RABBITMQ_QUEUE = "events-service.backlog-events";

export type BacklogEventType = "backlog.item.created" | "backlog.item.updated";

export type BacklogEvent = {
  eventId: string;
  type: BacklogEventType;
  occurredAt: string;
  userId: string;
  backlogEntry: {
    id: string;
    gameId: number;
    gameName: string;
    coverUrl: string | null;
    releaseYear: number | null;
    status: "want_to_play" | "playing" | "completed" | "abandoned";
    rating: number | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type StoredEvent = {
  eventId: string;
  type: BacklogEventType;
  occurredAt: string;
  userId: string;
  gameName: string;
  status: BacklogEvent["backlogEntry"]["status"];
  rating: number | null;
};

export function summarizeEvent(event: BacklogEvent): StoredEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    occurredAt: event.occurredAt,
    userId: event.userId,
    gameName: event.backlogEntry.gameName,
    status: event.backlogEntry.status,
    rating: event.backlogEntry.rating
  };
}
