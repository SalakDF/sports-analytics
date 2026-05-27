package com.diplomna.sports_analytics_backend.dto.request;

import lombok.Data;

@Data
public class ExternalMatchSyncRequest {
    private String competitionCode;
    private Long seasonId;
}