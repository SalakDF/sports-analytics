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
public class TheSportsDbClient {

    @Value("${thesportsdb.base-url:https://www.thesportsdb.com/api/v1/json}")
    private String baseUrl;

    @Value("${thesportsdb.api-key:3}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String getEventsByDate(String dateYmd) {
        String path = "/" + apiKey + "/eventsday.php?d=" + dateYmd + "&s=Soccer";
        return sendGet(path);
    }

    private String sendGet(String path) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
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
                        "TheSportsDB request failed. Status: "
                                + response.statusCode()
                                + ", Body: " + response.body()
                );
            }

            return response.body();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to call TheSportsDB", e);
        }
    }
}

