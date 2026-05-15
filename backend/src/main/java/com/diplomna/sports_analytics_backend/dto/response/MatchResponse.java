package com.diplomna.sports_analytics_backend.dto.response;

import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MatchResponse {
    private Long id;
    private LocalDateTime scheduledAt;
    private MatchStatus status;
    private Integer homeScore;
    private Integer awayScore;
    private String venue;
    private String roundName;
    private String tournamentName;
    private String seasonName;
    private Long homeTeamId;
    private String homeTeamName;
    private String homeTeamLogoUrl;
    private Long awayTeamId;
    private String awayTeamName;
    private String awayTeamLogoUrl;
}
