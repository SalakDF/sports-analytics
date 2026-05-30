package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamStatsResponse {
    private Integer matchesPlayed;
    private Integer wins;
    private Integer draws;
    private Integer losses;
    private Integer goalsFor;
    private Integer goalsAgainst;
    private Integer goalDifference;
    private Double winRate;
    private Double averageGoalsFor;
    private Double averageGoalsAgainst;
    private Integer cleanSheets;
}