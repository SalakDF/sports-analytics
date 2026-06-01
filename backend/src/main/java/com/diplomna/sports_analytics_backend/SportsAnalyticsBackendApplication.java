package com.diplomna.sports_analytics_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SportsAnalyticsBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SportsAnalyticsBackendApplication.class, args);
	}

}
