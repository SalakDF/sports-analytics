package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.FavoriteMatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.FavoriteTeamResponse;
import com.diplomna.sports_analytics_backend.entity.FavoriteMatch;
import com.diplomna.sports_analytics_backend.entity.FavoriteTeam;
import com.diplomna.sports_analytics_backend.entity.Match;
import com.diplomna.sports_analytics_backend.entity.Team;
import com.diplomna.sports_analytics_backend.entity.User;
import com.diplomna.sports_analytics_backend.repository.FavoriteMatchRepository;
import com.diplomna.sports_analytics_backend.repository.FavoriteTeamRepository;
import com.diplomna.sports_analytics_backend.repository.MatchRepository;
import com.diplomna.sports_analytics_backend.repository.TeamRepository;
import com.diplomna.sports_analytics_backend.repository.UserRepository;
import com.diplomna.sports_analytics_backend.util.TeamNameSanitizer;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteService {

    private final FavoriteTeamRepository favoriteTeamRepository;
    private final FavoriteMatchRepository favoriteMatchRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public FavoriteTeamResponse addFavoriteTeam(Long userId, Long teamId) {
        favoriteTeamRepository.findByUserIdAndTeamId(userId, teamId)
                .ifPresent(favorite -> {
                    throw new RuntimeException("Team is already in favorites");
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        FavoriteTeam favoriteTeam = favoriteTeamRepository.save(
                FavoriteTeam.builder()
                        .user(user)
                        .team(team)
                        .build()
        );

        return toTeamResponse(favoriteTeam);
    }

    public FavoriteMatchResponse addFavoriteMatch(Long userId, Long matchId) {
        favoriteMatchRepository.findByUserIdAndMatchId(userId, matchId)
                .ifPresent(favorite -> {
                    throw new RuntimeException("Match is already in favorites");
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        FavoriteMatch favoriteMatch = favoriteMatchRepository.save(
                FavoriteMatch.builder()
                        .user(user)
                        .match(match)
                        .build()
        );

        return toMatchResponse(favoriteMatch);
    }

    public List<FavoriteTeamResponse> getFavoriteTeams(Long userId) {
        return favoriteTeamRepository.findByUserId(userId)
                .stream()
                .map(this::toTeamResponse)
                .toList();
    }

    public List<FavoriteMatchResponse> getFavoriteMatches(Long userId) {
        return favoriteMatchRepository.findByUserId(userId)
                .stream()
                .map(this::toMatchResponse)
                .toList();
    }

    public void removeFavoriteTeam(Long userId, Long teamId) {
        favoriteTeamRepository.findByUserIdAndTeamId(userId, teamId)
                .orElseThrow(() -> new RuntimeException("Favorite team not found"));

        favoriteTeamRepository.deleteByUserIdAndTeamId(userId, teamId);
    }

    public void removeFavoriteMatch(Long userId, Long matchId) {
        favoriteMatchRepository.findByUserIdAndMatchId(userId, matchId)
                .orElseThrow(() -> new RuntimeException("Favorite match not found"));

        favoriteMatchRepository.deleteByUserIdAndMatchId(userId, matchId);
    }

    private FavoriteTeamResponse toTeamResponse(FavoriteTeam favoriteTeam) {
        Team team = favoriteTeam.getTeam();
        String displayName = TeamNameSanitizer.sanitizeDisplayName(team.getName());
        String displayShortName = TeamNameSanitizer.buildShortName(
                team.getShortName() != null && !team.getShortName().isBlank()
                        ? team.getShortName()
                        : displayName
        );

        return FavoriteTeamResponse.builder()
                .favoriteId(favoriteTeam.getId())
                .teamId(team.getId())
                .name(displayName)
                .shortName(displayShortName)
                .country(team.getCountry())
                .foundedYear(team.getFoundedYear())
                .build();
    }

    private FavoriteMatchResponse toMatchResponse(FavoriteMatch favoriteMatch) {
        Match match = favoriteMatch.getMatch();

        return FavoriteMatchResponse.builder()
                .favoriteId(favoriteMatch.getId())
                .matchId(match.getId())
                .homeTeamName(TeamNameSanitizer.sanitizeDisplayName(match.getHomeTeam().getName()))
                .awayTeamName(TeamNameSanitizer.sanitizeDisplayName(match.getAwayTeam().getName()))
                .tournamentName(match.getSeason().getTournament().getName())
                .seasonName(match.getSeason().getName())
                .scheduledAt(match.getScheduledAt())
                .status(match.getStatus())
                .homeScore(match.getHomeScore())
                .awayScore(match.getAwayScore())
                .build();
    }
}
