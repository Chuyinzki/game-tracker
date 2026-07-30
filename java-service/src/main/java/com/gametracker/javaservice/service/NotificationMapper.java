package com.gametracker.javaservice.service;

import com.gametracker.javaservice.model.BacklogEvent;
import com.gametracker.javaservice.model.NotificationRecord;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

	public NotificationRecord toNotification(BacklogEvent event) {
		String status = event.backlogEntry().status();
		String title = buildTitle(event.type(), event.backlogEntry().gameName(), status);
		String message = buildMessage(event.type(), event.backlogEntry().gameName(), status);
		String severity = buildSeverity(event.type(), status);

		return new NotificationRecord(
				event.eventId(),
				event.userId(),
				event.type(),
				title,
				message,
				severity,
				event.backlogEntry().gameName(),
				status,
				event.occurredAt());
	}

	private String buildTitle(String eventType, String gameName, String status) {
		if ("backlog.item.created".equals(eventType)) {
			return gameName + " added to backlog";
		}

		return gameName + " marked " + displayStatus(status);
	}

	private String buildMessage(String eventType, String gameName, String status) {
		if ("backlog.item.created".equals(eventType)) {
			return gameName + " was added and is ready for follow-up.";
		}

		return gameName + " status changed to " + displayStatus(status) + ".";
	}

	private String buildSeverity(String eventType, String status) {
		if ("backlog.item.created".equals(eventType)) {
			return "info";
		}

		if ("completed".equals(status)) {
			return "success";
		}

		if ("abandoned".equals(status)) {
			return "warning";
		}

		return "info";
	}

	private String displayStatus(String status) {
		return switch (status) {
			case "want_to_play" -> "want to play";
			case "playing" -> "playing";
			case "completed" -> "completed";
			case "abandoned" -> "abandoned";
			default -> status;
		};
	}
}
