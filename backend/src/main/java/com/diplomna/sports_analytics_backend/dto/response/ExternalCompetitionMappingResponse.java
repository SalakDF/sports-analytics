package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExternalCompetitionMappingResponse {
    private Long id;
    private String externalCompetitionCode;
    private String externalCompetitionName;
    private Long internalSeasonId;
    private String internalSeasonName;
}