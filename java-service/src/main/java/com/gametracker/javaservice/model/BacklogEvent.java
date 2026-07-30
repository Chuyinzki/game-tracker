package com.gametracker.javaservice.model;

public record BacklogEvent(
		String eventId,
		String type,
		String occurredAt,
		String userId,
		BacklogEntrySnapshot backlogEntry) {
}
