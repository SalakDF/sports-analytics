package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExternalTeamMappingResponse {
    private Long id;
    private Long externalTeamId;
    private String externalTeamName;
    private Long internalTeamId;
    private String internalTeamName;
}