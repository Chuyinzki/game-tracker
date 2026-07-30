package com.gametracker.javaservice.model;

public record NotificationRecord(
		String eventId,
		String userId,
		String eventType,
		String title,
		String message,
		String severity,
		String gameName,
		String status,
		String occurredAt) {
}
