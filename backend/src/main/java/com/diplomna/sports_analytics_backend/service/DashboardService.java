package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.DashboardResponse;
import com.diplomna.sports_analytics_backend.dto.response.MatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.SeasonOptionResponse;
import com.diplomna.sports_analytics_backend.dto.response.StandingResponse;
import com.diplomna.sports_analytics_backend.entity.Match;
import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import com.diplomna.sports_analytics_backend.entity.Season;
import com.diplomna.sports_analytics_backend.entity.Standing;
import com.diplomna.sports_analytics_backend.repository.MatchRepository;
import com.diplomna.sports_analytics_backend.repository.SeasonRepository;
import com.diplomna.sports_analytics_backend.repository.StandingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DashboardService {

    private final MatchRepository matchRepository;
    private final StandingRepository standingRepository;
    private final SeasonRepository seasonRepository;

    public DashboardResponse getDashboard() {
        List<Match> allMatches = matchRepository.findAllByOrderByScheduledAtDesc();

        long liveMatchesCount = allMatches.stream()
                .filter(match -> match.getStatus() == MatchStatus.LIVE)
                .count();

        long finishedMatchesCount = allMatches.stream()
                .filter(match -> match.getStatus() == MatchStatus.FINISHED)
                .count();

        long scheduledMatchesCount = allMatches.stream()
                .filter(match -> match.getStatus() == MatchStatus.SCHEDULED)
                .count();

        List<MatchResponse> recentMatches = allMatches.stream()
                .limit(4)
                .map(this::toMatchResponse)
                .toList();

        List<Season> seasonsData = seasonRepository.findAllByOrderByIdDesc();

        List<SeasonOptionResponse> seasons = seasonsData.stream()
                .limit(6)
                .map(this::toSeasonOptionResponse)
                .toList();

        List<StandingResponse> topStandings = List.of();

        if (!seasonsData.isEmpty()) {
            Long defaultSeasonId = seasonsData.get(0).getId();

            topStandings = standingRepository.findBySeasonIdOrderByPositionAsc(defaultSeasonId)
                    .stream()
                    .limit(5)
                    .map(this::toStandingResponse)
                    .toList();
        }

        return DashboardResponse.builder()
                .liveMatchesCount(liveMatchesCount)
                .finishedMatchesCount(finishedMatchesCount)
                .scheduledMatchesCount(scheduledMatchesCount)
                .recentMatches(recentMatches)
                .topStandings(topStandings)
                .seasons(seasons)
                .build();
    }

    private MatchResponse toMatchResponse(Match match) {
        return MatchResponse.builder()
                .id(match.getId())
                .scheduledAt(match.getScheduledAt())
                .status(match.getStatus())
                .homeScore(match.getHomeScore())
                .awayScore(match.getAwayScore())
                .venue(match.getVenue())
                .roundName(match.getRoundName())
                .tournamentName(match.getSeason().getTournament().getName())
                .seasonName(match.getSeason().getName())
                .homeTeamId(match.getHomeTeam().getId())
                .homeTeamName(match.getHomeTeam().getName())
                .homeTeamLogoUrl(match.getHomeTeam().getLogoUrl())
                .awayTeamId(match.getAwayTeam().getId())
                .awayTeamName(match.getAwayTeam().getName())
                .awayTeamLogoUrl(match.getAwayTeam().getLogoUrl())
                .build();
    }

    private StandingResponse toStandingResponse(Standing standing) {
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

    private SeasonOptionResponse toSeasonOptionResponse(Season season) {
        return SeasonOptionResponse.builder()
                .id(season.getId())
                .name(season.getName())
                .tournamentName(
                        season.getTournament() != null ? season.getTournament().getName() : null
                )
                .build();
    }
}