package com.gametracker.javaservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "application")
public record ApplicationProperties(Rabbit rabbit, Notifications notifications) {

	public record Rabbit(String exchange, String queue, String routingKey) {
	}

	public record Notifications(int limit) {
	}
}
