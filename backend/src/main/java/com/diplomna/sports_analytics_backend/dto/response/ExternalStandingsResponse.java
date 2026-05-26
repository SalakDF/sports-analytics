package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExternalStandingsResponse {
    private String competitionCode;
    private String competitionName;
    private String seasonStartDate;
    private String seasonEndDate;
    private String tableType;
    private List<ExternalStandingRowResponse> rows;
}