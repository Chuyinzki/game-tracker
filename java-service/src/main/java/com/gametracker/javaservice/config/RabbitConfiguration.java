package com.gametracker.javaservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfiguration {

	@Bean
	public Queue backlogEventQueue(ApplicationProperties properties) {
		return new Queue(properties.rabbit().queue(), true);
	}

	@Bean
	public TopicExchange backlogEventExchange(ApplicationProperties properties) {
		return new TopicExchange(properties.rabbit().exchange(), true, false);
	}

	@Bean
	public Binding backlogEventBinding(Queue backlogEventQueue, TopicExchange backlogEventExchange, ApplicationProperties properties) {
		return BindingBuilder.bind(backlogEventQueue).to(backlogEventExchange).with(properties.rabbit().routingKey());
	}
}
