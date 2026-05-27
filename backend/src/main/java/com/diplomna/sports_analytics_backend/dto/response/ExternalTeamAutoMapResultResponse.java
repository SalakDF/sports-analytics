package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExternalTeamAutoMapResultResponse {
    private String competitionCode;
    private Integer totalExternalTeams;
    private Integer mappedCount;
    private Integer alreadyMappedCount;
    private Integer skippedCount;
}