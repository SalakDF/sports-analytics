package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.MatchResponse;
import com.diplomna.sports_analytics_backend.entity.Match;
import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import com.diplomna.sports_analytics_backend.repository.MatchRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchService {

    private final MatchRepository matchRepository;

    public List<MatchResponse> getMatches(String search, MatchStatus status) {
        String normalizedSearch =
                (search == null || search.isBlank()) ? null : search.trim();

        List<Match> matches;

        if (normalizedSearch == null && status == null) {
            matches = matchRepository.findAllByOrderByScheduledAtDesc();
        } else if (normalizedSearch == null) {
            matches = matchRepository.findAllByStatusOrderByScheduledAtDesc(status);
        } else if (status == null) {
            matches = matchRepository.searchMatches(normalizedSearch);
        } else {
            matches = matchRepository.searchMatchesByStatus(normalizedSearch, status);
        }

        return matches.stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MatchResponse> getRecentMatchesByTeamId(Long teamId) {
        return matchRepository.findRecentFinishedMatchesByTeamId(teamId)
                .stream()
                .limit(5)
                .map(this::toResponse)
                .toList();
    }

    public MatchResponse getMatchById(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found with id: " + id));

        return toResponse(match);
    }

    public List<MatchResponse> getHeadToHeadByMatchId(Long matchId) {
        Match currentMatch = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found with id: " + matchId));

        return matchRepository.findHeadToHeadFinishedMatches(
                        currentMatch.getHomeTeam().getId(),
                        currentMatch.getAwayTeam().getId()
                )
                .stream()
                .filter(match -> !match.getId().equals(matchId))
                .limit(5)
                .map(this::toResponse)
                .toList();
    }

    private MatchResponse toResponse(Match match) {
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
}