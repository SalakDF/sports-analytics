package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.integration.ApiFootballClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApiFootballScoreEnrichmentService {

    private final ApiFootballClient apiFootballClient;
    private final ObjectMapper objectMapper;

    private static final Map<String, Integer> LEAGUE_IDS = Map.of(
            "PL", 39,
            "BL1", 78,
            "PD", 140,
            "SA", 135,
            "CL", 2
    );

    public Optional<EnrichedScore> findScore(
            String competitionCode,
            String utcDate,
            String homeTeamName,
            String awayTeamName
    ) {
        if (!apiFootballClient.isConfigured()) {
            return Optional.empty();
        }

        Integer leagueId = LEAGUE_IDS.get(competitionCode);
        if (leagueId == null || utcDate == null || utcDate.isBlank()) {
            return Optional.empty();
        }

        try {
            OffsetDateTime kickoffUtc = OffsetDateTime.parse(utcDate).withOffsetSameInstant(ZoneOffset.UTC);
            String dateYmd = kickoffUtc.toLocalDate().toString();
            int seasonYear = resolveSeasonYear(kickoffUtc);

            String json = apiFootballClient.getFixturesByLeagueSeasonAndDate(leagueId, seasonYear, dateYmd);
            JsonNode response = objectMapper.readTree(json).path("response");
            if (!response.isArray()) {
                return Optional.empty();
            }

            String homeNorm = normalize(homeTeamName);
            String awayNorm = normalize(awayTeamName);

            for (JsonNode fixtureNode : response) {
                JsonNode teamsNode = fixtureNode.path("teams");
                String apiHome = teamsNode.path("home").path("name").asText(null);
                String apiAway = teamsNode.path("away").path("name").asText(null);
                String apiHomeNorm = normalize(apiHome);
                String apiAwayNorm = normalize(apiAway);

                boolean sameOrder = homeNorm.equals(apiHomeNorm) && awayNorm.equals(apiAwayNorm);
                boolean reverseOrder = homeNorm.equals(apiAwayNorm) && awayNorm.equals(apiHomeNorm);

                if (!sameOrder && !reverseOrder) {
                    continue;
                }

                JsonNode goalsNode = fixtureNode.path("goals");
                Integer apiHomeScore = goalsNode.path("home").isNull() ? null : goalsNode.path("home").asInt();
                Integer apiAwayScore = goalsNode.path("away").isNull() ? null : goalsNode.path("away").asInt();
                String statusShort = fixtureNode.path("fixture").path("status").path("short").asText(null);

                Integer homeScore = sameOrder ? apiHomeScore : apiAwayScore;
                Integer awayScore = sameOrder ? apiAwayScore : apiHomeScore;
                return Optional.of(new EnrichedScore(homeScore, awayScore, statusShort));
            }
        } catch (Exception ignored) {
            return Optional.empty();
        }

        return Optional.empty();
    }

    private int resolveSeasonYear(OffsetDateTime kickoffUtc) {
        int year = kickoffUtc.getYear();
        int month = kickoffUtc.getMonthValue();
        return month >= 7 ? year : year - 1;
    }

    private String normalize(String value) {
        if (value == null) return "";
        return value.toLowerCase(Locale.ROOT)
                .replace("football club", " ")
                .replace("fc", " ")
                .replace("cf", " ")
                .replace("ac", " ")
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    @Data
    @AllArgsConstructor
    public static class EnrichedScore {
        private Integer homeScore;
        private Integer awayScore;
        private String externalStatusShort;
    }
}
