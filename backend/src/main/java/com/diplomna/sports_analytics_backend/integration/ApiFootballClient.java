package com.diplomna.sports_analytics_backend.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class ApiFootballClient {

    @Value("${api-football.base-url:https://v3.football.api-sports.io}")
    private String baseUrl;

    @Value("${api-football.api-key:}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getFixturesByLeagueSeasonAndDate(int leagueId, int season, String dateYmd) {
        String query = "/fixtures?league=" + leagueId
                + "&season=" + season
                + "&date=" + urlEncode(dateYmd);
        return sendGet(query);
    }

    public String getFixturesByLeagueSeason(int leagueId, int season) {
        String query = "/fixtures?league=" + leagueId + "&season=" + season;
        return sendGet(query);
    }

    public String getStandingsByLeagueSeason(int leagueId, int season) {
        String query = "/standings?league=" + leagueId + "&season=" + season;
        return sendGet(query);
    }

    public String getFixturesByTeam(Long teamId, int lastCount) {
        String query = "/fixtures?team=" + teamId + "&last=" + lastCount;
        return sendGet(query);
    }

    public String getFixtureEvents(Long fixtureId) {
        String query = "/fixtures/events?fixture=" + fixtureId;
        return sendGet(query);
    }

    private String sendGet(String pathWithQuery) {
        if (!isConfigured()) {
            throw new RuntimeException("API_FOOTBALL_API_KEY is missing");
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + pathWithQuery))
                .header("x-apisports-key", apiKey)
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
                        "API-Football request failed. Status: "
                                + response.statusCode()
                                + ", Body: " + response.body()
                );
            }

            return response.body();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to call API-Football", e);
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
