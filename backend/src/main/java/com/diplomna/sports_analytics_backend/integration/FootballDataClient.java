package com.diplomna.sports_analytics_backend.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
@RequiredArgsConstructor
public class FootballDataClient {

    @Value("${football-data.base-url}")
    private String baseUrl;

    @Value("${football-data.api-token}")
    private String apiToken;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String getCompetitions() {
        return sendGet("/competitions");
    }

    public String getCompetitionMatches(String competitionCode) {
        return sendGet("/competitions/" + competitionCode + "/matches");
    }

    public String getCompetitionStandings(String competitionCode) {
        return sendGet("/competitions/" + competitionCode + "/standings");
    }

    public String getTeamMatches(Long teamId) {
        return sendGet("/teams/" + teamId + "/matches");
    }

    private String sendGet(String path) {
        if (apiToken == null || apiToken.isBlank()) {
            throw new RuntimeException("FOOTBALL_DATA_API_TOKEN is missing");
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .header("X-Auth-Token", apiToken)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() >= 400) {
                throw new RuntimeException(
                        "Football Data API request failed. Status: "
                                + response.statusCode()
                                + ", Body: " + response.body()
                );
            }

            return response.body();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to call Football Data API", e);
        }
    }
}