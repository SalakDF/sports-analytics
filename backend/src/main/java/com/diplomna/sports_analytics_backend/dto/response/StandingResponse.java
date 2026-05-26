package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StandingResponse {
    private Long id;
    private Integer position;
    private Integer points;
    private Integer played;
    private Integer wins;
    private Integer draws;
    private Integer losses;
    private Integer goalsFor;
    private Integer goalsAgainst;

    private Long teamId;
    private String teamName;
    private String teamLogoUrl;

    private Long seasonId;
    private String seasonName;
    private String tournamentName;
}