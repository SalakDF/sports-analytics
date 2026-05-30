package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.TeamStatsResponse;
import com.diplomna.sports_analytics_backend.entity.Match;
import com.diplomna.sports_analytics_backend.repository.MatchRepository;
import com.diplomna.sports_analytics_backend.repository.TeamRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamStatsService {

    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public TeamStatsResponse getTeamStats(Long teamId) {
        teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        List<Match> matches = matchRepository.findFinishedMatchesByTeamId(teamId);

        int matchesPlayed = matches.size();
        int wins = 0;
        int draws = 0;
        int losses = 0;
        int goalsFor = 0;
        int goalsAgainst = 0;
        int cleanSheets = 0;

        for (Match match : matches) {
            boolean isHome = match.getHomeTeam().getId().equals(teamId);

            int teamScore = isHome
                    ? safeValue(match.getHomeScore())
                    : safeValue(match.getAwayScore());

            int opponentScore = isHome
                    ? safeValue(match.getAwayScore())
                    : safeValue(match.getHomeScore());

            goalsFor += teamScore;
            goalsAgainst += opponentScore;

            if (teamScore > opponentScore) {
                wins++;
            } else if (teamScore == opponentScore) {
                draws++;
            } else {
                losses++;
            }

            if (opponentScore == 0) {
                cleanSheets++;
            }
        }

        int goalDifference = goalsFor - goalsAgainst;

        double winRate = matchesPlayed == 0
                ? 0.0
                : roundToTwoDecimals((wins * 100.0) / matchesPlayed);

        double averageGoalsFor = matchesPlayed == 0
                ? 0.0
                : roundToTwoDecimals(goalsFor * 1.0 / matchesPlayed);

        double averageGoalsAgainst = matchesPlayed == 0
                ? 0.0
                : roundToTwoDecimals(goalsAgainst * 1.0 / matchesPlayed);

        return TeamStatsResponse.builder()
                .matchesPlayed(matchesPlayed)
                .wins(wins)
                .draws(draws)
                .losses(losses)
                .goalsFor(goalsFor)
                .goalsAgainst(goalsAgainst)
                .goalDifference(goalDifference)
                .winRate(winRate)
                .averageGoalsFor(averageGoalsFor)
                .averageGoalsAgainst(averageGoalsAgainst)
                .cleanSheets(cleanSheets)
                .build();
    }

    private int safeValue(Integer value) {
        return value == null ? 0 : value;
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}