package com.gametracker.javaservice.store;

import com.gametracker.javaservice.model.NotificationRecord;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.stereotype.Component;

@Component
public class NotificationStore {

	private final Deque<NotificationRecord> notifications = new ConcurrentLinkedDeque<>();

	public void add(NotificationRecord notification, int limit) {
		synchronized (notifications) {
			notifications.addFirst(notification);
			while (notifications.size() > limit) {
				notifications.removeLast();
			}
		}
	}

	public List<NotificationRecord> findByUserId(String userId, int limit) {
		synchronized (notifications) {
			List<NotificationRecord> matches = new ArrayList<>();
			for (NotificationRecord notification : notifications) {
				if (notification.userId().equals(userId)) {
					matches.add(notification);
				}
				if (matches.size() >= limit) {
					break;
				}
			}
			return matches;
		}
	}

	public NotificationRecord latestForUser(String userId) {
		synchronized (notifications) {
			for (NotificationRecord notification : notifications) {
				if (notification.userId().equals(userId)) {
					return notification;
				}
			}
			return null;
		}
	}
}
