package com.gametracker.javaservice.model;

import java.util.List;

public record NotificationDigest(
		int notificationCount,
		String latestNotificationTitle,
		String latestNotificationGame,
		List<NotificationRecord> recentNotifications,
		String generatedAt) {
}
