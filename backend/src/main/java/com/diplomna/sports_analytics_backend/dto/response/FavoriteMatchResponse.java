package com.diplomna.sports_analytics_backend.dto.response;

import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FavoriteMatchResponse {
    private Long favoriteId;
    private Long matchId;
    private String homeTeamName;
    private String awayTeamName;
    private String tournamentName;
    private String seasonName;
    private LocalDateTime scheduledAt;
    private MatchStatus status;
    private Integer homeScore;
    private Integer awayScore;
}