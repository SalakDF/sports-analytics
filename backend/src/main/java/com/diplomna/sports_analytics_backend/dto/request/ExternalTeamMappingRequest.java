package com.diplomna.sports_analytics_backend.dto.request;

import lombok.Data;

@Data
public class ExternalTeamMappingRequest {
    private Long externalTeamId;
    private String externalTeamName;
    private Long internalTeamId;
}