package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImportResultResponse {
    private String competitionCode;
    private Integer importedCount;
    private Integer updatedCount;
    private Integer totalCount;
}