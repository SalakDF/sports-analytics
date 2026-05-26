package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.StandingResponse;
import com.diplomna.sports_analytics_backend.entity.Standing;
import com.diplomna.sports_analytics_backend.repository.SeasonRepository;
import com.diplomna.sports_analytics_backend.repository.StandingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StandingService {

    private final StandingRepository standingRepository;
    private final SeasonRepository seasonRepository;

    public List<StandingResponse> getStandings(Long seasonId) {
        Long resolvedSeasonId = seasonId;

        if (resolvedSeasonId == null) {
            resolvedSeasonId = seasonRepository.findAllByOrderByIdDesc()
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No seasons found"))
                    .getId();
        }

        return standingRepository.findBySeasonIdOrderByPositionAsc(resolvedSeasonId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private StandingResponse toResponse(Standing standing) {
        return StandingResponse.builder()
                .id(standing.getId())
                .position(standing.getPosition())
                .points(standing.getPoints())
                .played(standing.getPlayed())
                .wins(standing.getWins())
                .draws(standing.getDraws())
                .losses(standing.getLosses())
                .goalsFor(standing.getGoalsFor())
                .goalsAgainst(standing.getGoalsAgainst())
                .teamId(standing.getTeam().getId())
                .teamName(standing.getTeam().getName())
                .teamLogoUrl(standing.getTeam().getLogoUrl())
                .seasonId(standing.getSeason().getId())
                .seasonName(standing.getSeason().getName())
                .tournamentName(
                        standing.getSeason().getTournament() != null
                                ? standing.getSeason().getTournament().getName()
                                : null
                )
                .build();
    }
}