package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.StandingResponse;
import com.diplomna.sports_analytics_backend.entity.Standing;
import com.diplomna.sports_analytics_backend.repository.StandingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StandingService {

    private final StandingRepository standingRepository;

    public List<StandingResponse> getStandingsBySeasonId(Long seasonId) {
        return standingRepository.findBySeasonIdOrderByPositionAsc(seasonId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private StandingResponse toResponse(Standing standing) {
        return StandingResponse.builder()
                .id(standing.getId())
                .position(standing.getPosition())
                .played(standing.getPlayed())
                .wins(standing.getWins())
                .draws(standing.getDraws())
                .losses(standing.getLosses())
                .goalsFor(standing.getGoalsFor())
                .goalsAgainst(standing.getGoalsAgainst())
                .goalDifference(standing.getGoalDifference())
                .points(standing.getPoints())
                .teamId(standing.getTeam().getId())
                .teamName(standing.getTeam().getName())
                .teamShortName(standing.getTeam().getShortName())
                .teamLogoUrl(standing.getTeam().getLogoUrl())
                .seasonId(standing.getSeason().getId())
                .seasonName(standing.getSeason().getName())
                .build();
    }
}
