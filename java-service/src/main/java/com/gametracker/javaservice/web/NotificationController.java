package com.gametracker.javaservice.web;

import com.gametracker.javaservice.config.ApplicationProperties;
import com.gametracker.javaservice.model.NotificationDigest;
import com.gametracker.javaservice.model.NotificationRecord;
import com.gametracker.javaservice.store.NotificationStore;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NotificationController {

	private final NotificationStore notificationStore;
	private final ApplicationProperties properties;

	public NotificationController(NotificationStore notificationStore, ApplicationProperties properties) {
		this.notificationStore = notificationStore;
		this.properties = properties;
	}

	@GetMapping("/health")
	public ResponseEntity<?> health() {
		return ResponseEntity.ok().body(java.util.Map.of("ok", true));
	}

	@GetMapping("/notifications/digest")
	public ResponseEntity<?> digest(
			@RequestHeader(value = "x-user-id", required = false) String userId,
			@RequestHeader(value = "x-user-email", required = false) String userEmail) {
		if (userId == null || userId.isBlank() || userEmail == null || userEmail.isBlank()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("message", "unauthorized"));
		}

		List<NotificationRecord> recent = notificationStore.findByUserId(userId, properties.notifications().limit());
		NotificationRecord latest = notificationStore.latestForUser(userId);

		NotificationDigest response = new NotificationDigest(
				recent.size(),
				latest == null ? null : latest.title(),
				latest == null ? null : latest.gameName(),
				recent,
				Instant.now().toString());

		return ResponseEntity.ok(response);
	}
}
