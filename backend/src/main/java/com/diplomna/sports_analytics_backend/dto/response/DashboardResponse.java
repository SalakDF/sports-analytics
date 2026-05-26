package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private Long liveMatchesCount;
    private Long finishedMatchesCount;
    private Long scheduledMatchesCount;

    private List<MatchResponse> recentMatches;
    private List<StandingResponse> topStandings;
    private List<SeasonOptionResponse> seasons;
}