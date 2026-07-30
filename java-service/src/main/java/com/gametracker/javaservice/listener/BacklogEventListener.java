package com.gametracker.javaservice.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gametracker.javaservice.config.ApplicationProperties;
import com.gametracker.javaservice.model.BacklogEvent;
import com.gametracker.javaservice.model.NotificationRecord;
import com.gametracker.javaservice.service.NotificationMapper;
import com.gametracker.javaservice.store.NotificationStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class BacklogEventListener {

	private static final Logger log = LoggerFactory.getLogger(BacklogEventListener.class);

	private final ObjectMapper objectMapper;
	private final NotificationMapper notificationMapper;
	private final NotificationStore notificationStore;
	private final ApplicationProperties properties;

	public BacklogEventListener(
			ObjectMapper objectMapper,
			NotificationMapper notificationMapper,
			NotificationStore notificationStore,
			ApplicationProperties properties) {
		this.objectMapper = objectMapper;
		this.notificationMapper = notificationMapper;
		this.notificationStore = notificationStore;
		this.properties = properties;
	}

	@RabbitListener(queues = "${application.rabbit.queue}")
	public void handleMessage(byte[] payload) throws Exception {
		BacklogEvent event = objectMapper.readValue(payload, BacklogEvent.class);
		NotificationRecord notification = notificationMapper.toNotification(event);
		notificationStore.add(notification, properties.notifications().limit());
		log.info("stored notification {} for {}", notification.eventType(), notification.gameName());
	}
}
