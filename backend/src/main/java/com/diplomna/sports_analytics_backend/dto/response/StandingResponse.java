package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StandingResponse {
    private Long id;
    private Integer position;
    private Integer played;
    private Integer wins;
    private Integer draws;
    private Integer losses;
    private Integer goalsFor;
    private Integer goalsAgainst;
    private Integer goalDifference;
    private Integer points;

    private Long teamId;
    private String teamName;
    private String teamShortName;
    private String teamLogoUrl;

    private Long seasonId;
    private String seasonName;
}
