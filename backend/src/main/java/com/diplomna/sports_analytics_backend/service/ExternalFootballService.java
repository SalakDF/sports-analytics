package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.ExternalMatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingRowResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingsResponse;
import com.diplomna.sports_analytics_backend.integration.FootballDataClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExternalFootballService {

    private final FootballDataClient footballDataClient;
    private final ObjectMapper objectMapper;

    public List<ExternalMatchResponse> getCompetitionMatches(String competitionCode) {
        try {
            String json = footballDataClient.getCompetitionMatches(competitionCode);
            JsonNode root = objectMapper.readTree(json);

            JsonNode competitionNode = root.path("competition");
            String resolvedCompetitionCode = competitionNode.path("code").asText(null);
            String resolvedCompetitionName = competitionNode.path("name").asText(null);

            JsonNode matchesNode = root.path("matches");
            List<ExternalMatchResponse> result = new ArrayList<>();

            for (JsonNode matchNode : matchesNode) {
                result.add(toMatchResponse(matchNode, resolvedCompetitionCode, resolvedCompetitionName));
            }

            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to map external football matches", e);
        }
    }

    public ExternalStandingsResponse getCompetitionStandings(String competitionCode) {
        try {
            String json = footballDataClient.getCompetitionStandings(competitionCode);
            JsonNode root = objectMapper.readTree(json);

            JsonNode competitionNode = root.path("competition");
            JsonNode seasonNode = root.path("season");
            JsonNode standingsNode = root.path("standings");

            JsonNode mainTableNode = null;

            for (JsonNode standingNode : standingsNode) {
                String type = standingNode.path("type").asText("");
                if ("TOTAL".equalsIgnoreCase(type)) {
                    mainTableNode = standingNode;
                    break;
                }
            }

            if (mainTableNode == null && standingsNode.isArray() && !standingsNode.isEmpty()) {
                mainTableNode = standingsNode.get(0);
            }

            if (mainTableNode == null) {
                return ExternalStandingsResponse.builder()
                        .competitionCode(competitionNode.path("code").asText(null))
                        .competitionName(competitionNode.path("name").asText(null))
                        .seasonStartDate(seasonNode.path("startDate").asText(null))
                        .seasonEndDate(seasonNode.path("endDate").asText(null))
                        .tableType(null)
                        .rows(List.of())
                        .build();
            }

            List<ExternalStandingRowResponse> rows = new ArrayList<>();
            JsonNode tableRows = mainTableNode.path("table");

            for (JsonNode row : tableRows) {
                rows.add(
                        ExternalStandingRowResponse.builder()
                                .position(row.path("position").asInt())
                                .teamId(row.path("team").path("id").asLong())
                                .teamName(row.path("team").path("name").asText(null))
                                .playedGames(row.path("playedGames").asInt())
                                .wins(row.path("won").asInt())
                                .draws(row.path("draw").asInt())
                                .losses(row.path("lost").asInt())
                                .goalsFor(row.path("goalsFor").asInt())
                                .goalsAgainst(row.path("goalsAgainst").asInt())
                                .points(row.path("points").asInt())
                                .build()
                );
            }

            return ExternalStandingsResponse.builder()
                    .competitionCode(competitionNode.path("code").asText(null))
                    .competitionName(competitionNode.path("name").asText(null))
                    .seasonStartDate(seasonNode.path("startDate").asText(null))
                    .seasonEndDate(seasonNode.path("endDate").asText(null))
                    .tableType(mainTableNode.path("type").asText(null))
                    .rows(rows)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to map external football standings", e);
        }
    }

    public List<ExternalMatchResponse> getTeamMatches(Long teamId) {
        try {
            String json = footballDataClient.getTeamMatches(teamId);
            JsonNode root = objectMapper.readTree(json);

            JsonNode matchesNode = root.path("matches");
            List<ExternalMatchResponse> result = new ArrayList<>();

            for (JsonNode matchNode : matchesNode) {
                JsonNode competitionNode = matchNode.path("competition");
                String competitionCode = competitionNode.path("code").asText(null);
                String competitionName = competitionNode.path("name").asText(null);

                result.add(toMatchResponse(matchNode, competitionCode, competitionName));
            }

            return result.stream().limit(12).toList();
        } catch (Exception e) {
            throw new RuntimeException("Failed to map external team matches", e);
        }
    }

    private ExternalMatchResponse toMatchResponse(
            JsonNode matchNode,
            String competitionCode,
            String competitionName
    ) {
        Integer homeScore = null;
        Integer awayScore = null;

        JsonNode fullTimeNode = matchNode.path("score").path("fullTime");

        if (!fullTimeNode.isMissingNode()) {
            if (!fullTimeNode.path("home").isNull() && !fullTimeNode.path("home").isMissingNode()) {
                homeScore = fullTimeNode.path("home").asInt();
            }

            if (!fullTimeNode.path("away").isNull() && !fullTimeNode.path("away").isMissingNode()) {
                awayScore = fullTimeNode.path("away").asInt();
            }
        }

        return ExternalMatchResponse.builder()
                .id(matchNode.path("id").asLong())
                .competitionCode(competitionCode)
                .competitionName(competitionName)
                .utcDate(matchNode.path("utcDate").asText(null))
                .status(matchNode.path("status").asText(null))
                .homeTeamId(matchNode.path("homeTeam").path("id").asLong())
                .homeTeamName(matchNode.path("homeTeam").path("name").asText(null))
                .awayTeamId(matchNode.path("awayTeam").path("id").asLong())
                .awayTeamName(matchNode.path("awayTeam").path("name").asText(null))
                .homeScore(homeScore)
                .awayScore(awayScore)
                .build();
    }
}