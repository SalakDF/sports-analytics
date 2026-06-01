package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.integration.FootballDataClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FootballDataScoreEnrichmentService {

    private final FootballDataClient footballDataClient;
    private final ObjectMapper objectMapper;

    public Optional<EnrichedScore> findScore(
            String competitionCode,
            String utcDate,
            String homeTeamName,
            String awayTeamName
    ) {
        if (competitionCode == null || competitionCode.isBlank() || utcDate == null || utcDate.isBlank()) {
            return Optional.empty();
        }

        try {
            OffsetDateTime kickoffUtc = OffsetDateTime.parse(utcDate).withOffsetSameInstant(ZoneOffset.UTC);
            String dateYmd = kickoffUtc.toLocalDate().toString();

            String json = footballDataClient.getCompetitionMatches(competitionCode);
            JsonNode matches = objectMapper.readTree(json).path("matches");
            if (!matches.isArray()) {
                return Optional.empty();
            }

            String homeNorm = normalize(homeTeamName);
            String awayNorm = normalize(awayTeamName);

            for (JsonNode matchNode : matches) {
                String matchDate = matchNode.path("utcDate").asText("");
                if (!matchDate.startsWith(dateYmd)) {
                    continue;
                }

                String fdHome = matchNode.path("homeTeam").path("name").asText(null);
                String fdAway = matchNode.path("awayTeam").path("name").asText(null);
                String fdHomeNorm = normalize(fdHome);
                String fdAwayNorm = normalize(fdAway);

                boolean sameOrder = homeNorm.equals(fdHomeNorm) && awayNorm.equals(fdAwayNorm);
                boolean reverseOrder = homeNorm.equals(fdAwayNorm) && awayNorm.equals(fdHomeNorm);
                if (!sameOrder && !reverseOrder) {
                    continue;
                }

                JsonNode scoreNode = matchNode.path("score").path("fullTime");
                Integer fdHomeScore = scoreNode.path("home").isNull() ? null : scoreNode.path("home").asInt();
                Integer fdAwayScore = scoreNode.path("away").isNull() ? null : scoreNode.path("away").asInt();
                String fdStatus = matchNode.path("status").asText(null);

                Integer homeScore = sameOrder ? fdHomeScore : fdAwayScore;
                Integer awayScore = sameOrder ? fdAwayScore : fdHomeScore;

                return Optional.of(new EnrichedScore(homeScore, awayScore, fdStatus));
            }
        } catch (Exception ignored) {
            return Optional.empty();
        }

        return Optional.empty();
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
        private String externalStatus;
    }
}
