package com.diplomna.sports_analytics_backend.dto.request;

import lombok.Data;

@Data
public class ExternalCompetitionMappingRequest {
    private String externalCompetitionCode;
    private String externalCompetitionName;
    private Long internalSeasonId;
}