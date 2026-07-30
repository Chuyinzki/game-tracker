package com.gametracker.javaservice;

import com.gametracker.javaservice.config.ApplicationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(ApplicationProperties.class)
public class JavaServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(JavaServiceApplication.class, args);
	}
}
