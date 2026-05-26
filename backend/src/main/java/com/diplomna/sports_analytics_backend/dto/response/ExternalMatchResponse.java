package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExternalMatchResponse {
    private Long id;
    private String competitionCode;
    private String competitionName;
    private String utcDate;
    private String status;

    private Long homeTeamId;
    private String homeTeamName;

    private Long awayTeamId;
    private String awayTeamName;

    private Integer homeScore;
    private Integer awayScore;
}