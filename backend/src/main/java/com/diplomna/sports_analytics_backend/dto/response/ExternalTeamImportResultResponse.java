package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExternalTeamImportResultResponse {
    private String competitionCode;
    private Integer totalExternalTeams;
    private Integer createdTeams;
    private Integer alreadyExistingTeams;
}