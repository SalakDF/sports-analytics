package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExternalMatchSyncResultResponse {
    private String competitionCode;
    private Long seasonId;
    private Integer refreshedExternalCount;
    private Integer createdInternalCount;
    private Integer updatedInternalCount;
    private Integer skippedCount;
}