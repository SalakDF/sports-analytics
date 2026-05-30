package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.entity.Match;
import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import com.diplomna.sports_analytics_backend.entity.Season;
import com.diplomna.sports_analytics_backend.entity.Standing;
import com.diplomna.sports_analytics_backend.entity.Team;
import com.diplomna.sports_analytics_backend.repository.MatchRepository;
import com.diplomna.sports_analytics_backend.repository.SeasonRepository;
import com.diplomna.sports_analytics_backend.repository.StandingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class StandingRebuildService {

    private final SeasonRepository seasonRepository;
    private final MatchRepository matchRepository;
    private final StandingRepository standingRepository;

    public void rebuildSeasonStandings(Long seasonId) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new RuntimeException("Season not found"));

        List<Match> matches = matchRepository.findBySeasonIdOrderByScheduledAtAsc(seasonId);

        Map<Long, StandingAccumulator> table = new LinkedHashMap<>();

        for (Match match : matches) {
            addTeamIfMissing(table, season, match.getHomeTeam());
            addTeamIfMissing(table, season, match.getAwayTeam());

            if (match.getStatus() != MatchStatus.FINISHED) {
                continue;
            }

            StandingAccumulator home = table.get(match.getHomeTeam().getId());
            StandingAccumulator away = table.get(match.getAwayTeam().getId());

            int homeScore = safe(match.getHomeScore());
            int awayScore = safe(match.getAwayScore());

            home.played++;
            away.played++;

            home.goalsFor += homeScore;
            home.goalsAgainst += awayScore;

            away.goalsFor += awayScore;
            away.goalsAgainst += homeScore;

            if (homeScore > awayScore) {
                home.wins++;
                home.points += 3;
                away.losses++;
            } else if (homeScore < awayScore) {
                away.wins++;
                away.points += 3;
                home.losses++;
            } else {
                home.draws++;
                away.draws++;
                home.points++;
                away.points++;
            }
        }

        List<StandingAccumulator> sorted = new ArrayList<>(table.values());

        sorted.sort(
                Comparator.comparingInt(StandingAccumulator::getPoints).reversed()
                        .thenComparingInt(StandingAccumulator::getGoalDifference).reversed()
                        .thenComparingInt(StandingAccumulator::getGoalsFor).reversed()
                        .thenComparing(acc -> acc.team.getName(), String.CASE_INSENSITIVE_ORDER)
        );

        standingRepository.deleteAllBySeasonId(seasonId);
        standingRepository.flush();

        int position = 1;
        for (StandingAccumulator acc : sorted) {
            Standing standing = Standing.builder()
                    .season(season)
                    .team(acc.team)
                    .position(position++)
                    .played(acc.played)
                    .wins(acc.wins)
                    .draws(acc.draws)
                    .losses(acc.losses)
                    .goalsFor(acc.goalsFor)
                    .goalsAgainst(acc.goalsAgainst)
                    .goalDifference(acc.getGoalDifference())
                    .points(acc.points)
                    .build();

            standingRepository.save(standing);
        }
    }

    private void addTeamIfMissing(Map<Long, StandingAccumulator> table, Season season, Team team) {
        table.computeIfAbsent(team.getId(), ignored -> new StandingAccumulator(season, team));
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private static class StandingAccumulator {
        private final Season season;
        private final Team team;
        private int played;
        private int wins;
        private int draws;
        private int losses;
        private int goalsFor;
        private int goalsAgainst;
        private int points;

        private StandingAccumulator(Season season, Team team) {
            this.season = season;
            this.team = team;
        }

        private int getPoints() {
            return points;
        }

        private int getGoalsFor() {
            return goalsFor;
        }

        private int getGoalDifference() {
            return goalsFor - goalsAgainst;
        }
    }
}