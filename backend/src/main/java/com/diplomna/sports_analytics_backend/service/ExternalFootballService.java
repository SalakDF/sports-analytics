package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.ExternalMatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingRowResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingsResponse;
import com.diplomna.sports_analytics_backend.integration.ApiFootballClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExternalFootballService {

    private final ApiFootballClient apiFootballClient;
    private final ObjectMapper objectMapper;

    private static final Map<String, Integer> LEAGUE_IDS = Map.of(
            "PL", 39,
            "BL1", 78,
            "PD", 140,
            "SA", 135,
            "CL", 2
    );

    private static final Map<String, String> LEAGUE_NAMES = Map.of(
            "PL", "Premier League",
            "BL1", "Bundesliga",
            "PD", "La Liga",
            "SA", "Serie A",
            "CL", "Champions League"
    );

    public List<ExternalMatchResponse> getCompetitionMatches(String competitionCode) {
        try {
            int leagueId = resolveLeagueId(competitionCode);
            int seasonYear = currentSeasonYear();
            String json = apiFootballClient.getFixturesByLeagueSeason(leagueId, seasonYear);
            JsonNode response = objectMapper.readTree(json).path("response");

            List<ExternalMatchResponse> result = new ArrayList<>();
            if (!response.isArray()) return result;

            for (JsonNode fixtureNode : response) {
                result.add(toMatchResponse(fixtureNode, competitionCode, LEAGUE_NAMES.get(competitionCode)));
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to map API-Football matches", e);
        }
    }

    public ExternalStandingsResponse getCompetitionStandings(String competitionCode) {
        try {
            int leagueId = resolveLeagueId(competitionCode);
            int seasonYear = currentSeasonYear();
            String json = apiFootballClient.getStandingsByLeagueSeason(leagueId, seasonYear);
            JsonNode response = objectMapper.readTree(json).path("response");

            List<ExternalStandingRowResponse> rows = new ArrayList<>();
            if (response.isArray() && !response.isEmpty()) {
                JsonNode standings = response.get(0).path("league").path("standings");
                JsonNode table = standings.isArray() && !standings.isEmpty() ? standings.get(0) : null;

                if (table != null && table.isArray()) {
                    for (JsonNode row : table) {
                        rows.add(
                                ExternalStandingRowResponse.builder()
                                        .position(row.path("rank").asInt())
                                        .teamId(row.path("team").path("id").asLong())
                                        .teamName(row.path("team").path("name").asText(null))
                                        .playedGames(row.path("all").path("played").asInt())
                                        .wins(row.path("all").path("win").asInt())
                                        .draws(row.path("all").path("draw").asInt())
                                        .losses(row.path("all").path("lose").asInt())
                                        .goalsFor(row.path("all").path("goals").path("for").asInt())
                                        .goalsAgainst(row.path("all").path("goals").path("against").asInt())
                                        .points(row.path("points").asInt())
                                        .build()
                        );
                    }
                }
            }

            return ExternalStandingsResponse.builder()
                    .competitionCode(competitionCode)
                    .competitionName(LEAGUE_NAMES.get(competitionCode))
                    .seasonStartDate(null)
                    .seasonEndDate(null)
                    .tableType("TOTAL")
                    .rows(rows)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to map API-Football standings", e);
        }
    }

    public List<ExternalMatchResponse> getTeamMatches(Long teamId) {
        try {
            String json = apiFootballClient.getFixturesByTeam(teamId, 12);
            JsonNode response = objectMapper.readTree(json).path("response");
            List<ExternalMatchResponse> result = new ArrayList<>();
            if (!response.isArray()) return result;

            for (JsonNode fixtureNode : response) {
                JsonNode leagueNode = fixtureNode.path("league");
                String competitionName = leagueNode.path("name").asText(null);
                String competitionCode = mapLeagueIdToCode(leagueNode.path("id").asInt());
                result.add(toMatchResponse(fixtureNode, competitionCode, competitionName));
            }

            return result.stream().limit(12).toList();
        } catch (Exception e) {
            throw new RuntimeException("Failed to map API-Football team matches", e);
        }
    }

    private ExternalMatchResponse toMatchResponse(
            JsonNode fixtureNode,
            String competitionCode,
            String competitionName
    ) {
        JsonNode fixture = fixtureNode.path("fixture");
        JsonNode teams = fixtureNode.path("teams");
        JsonNode goals = fixtureNode.path("goals");

        Integer homeScore = goals.path("home").isNull() ? null : goals.path("home").asInt();
        Integer awayScore = goals.path("away").isNull() ? null : goals.path("away").asInt();

        return ExternalMatchResponse.builder()
                .id(fixture.path("id").asLong())
                .competitionCode(competitionCode)
                .competitionName(competitionName)
                .utcDate(fixture.path("date").asText(null))
                .status(mapStatusShortToLegacyStatus(fixture.path("status").path("short").asText(null)))
                .homeTeamId(teams.path("home").path("id").asLong())
                .homeTeamName(teams.path("home").path("name").asText(null))
                .awayTeamId(teams.path("away").path("id").asLong())
                .awayTeamName(teams.path("away").path("name").asText(null))
                .homeScore(homeScore)
                .awayScore(awayScore)
                .build();
    }

    private int resolveLeagueId(String competitionCode) {
        Integer id = LEAGUE_IDS.get(competitionCode);
        if (id == null) {
            throw new RuntimeException("Unsupported competition code for API-Football: " + competitionCode);
        }
        return id;
    }

    private int currentSeasonYear() {
        int year = java.time.LocalDate.now().getYear();
        int month = java.time.LocalDate.now().getMonthValue();
        return month >= 7 ? year : year - 1;
    }

    private String mapLeagueIdToCode(int leagueId) {
        if (leagueId == 39) return "PL";
        if (leagueId == 78) return "BL1";
        if (leagueId == 140) return "PD";
        if (leagueId == 135) return "SA";
        if (leagueId == 2) return "CL";
        return null;
    }

    private String mapStatusShortToLegacyStatus(String shortStatus) {
        if (shortStatus == null || shortStatus.isBlank()) return "TIMED";
        return switch (shortStatus) {
            case "FT", "AET", "PEN", "WO" -> "FINISHED";
            case "1H", "2H", "HT", "ET", "BT", "P" -> "IN_PLAY";
            case "PST", "SUSP", "INT", "ABD" -> "POSTPONED";
            case "CANC" -> "CANCELED";
            default -> "TIMED";
        };
    }
}

