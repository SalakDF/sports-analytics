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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchSeedService {

    private final SeasonRepository seasonRepository;
    private final StandingRepository standingRepository;
    private final MatchRepository matchRepository;

    public String seedFixtures(Long seasonId) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new RuntimeException("Season not found"));

        List<Team> teams = resolveSeasonTeams(seasonId);

        if (teams.size() < 4) {
            throw new RuntimeException("Not enough teams in selected season");
        }

        clearOldSeededFixtures(seasonId);

        int created = 0;

        created += createSeededMatch(
                season,
                teams.get(0),
                teams.get(1),
                LocalDateTime.now().minusMinutes(18),
                MatchStatus.LIVE,
                1,
                0,
                "City Stadium",
                "Matchweek 32",
                "seed:live:1"
        );

        created += createSeededMatch(
                season,
                teams.get(2),
                teams.get(3),
                LocalDateTime.now().minusMinutes(34),
                MatchStatus.LIVE,
                2,
                2,
                "National Arena",
                "Matchweek 32",
                "seed:live:2"
        );

        created += createSeededMatch(
                season,
                teams.get(1),
                teams.get(2),
                LocalDateTime.now().plusHours(5),
                MatchStatus.SCHEDULED,
                null,
                null,
                "Central Park Stadium",
                "Matchweek 33",
                "seed:scheduled:1"
        );

        created += createSeededMatch(
                season,
                teams.get(3),
                teams.get(0),
                LocalDateTime.now().plusDays(1),
                MatchStatus.SCHEDULED,
                null,
                null,
                "Riverside Stadium",
                "Matchweek 33",
                "seed:scheduled:2"
        );

        if (teams.size() >= 6) {
            created += createSeededMatch(
                    season,
                    teams.get(4),
                    teams.get(5),
                    LocalDateTime.now().plusDays(2),
                    MatchStatus.SCHEDULED,
                    null,
                    null,
                    "Metropolitan Stadium",
                    "Matchweek 33",
                    "seed:scheduled:3"
            );
        }

        return "Seeded fixtures created: " + created;
    }

    private List<Team> resolveSeasonTeams(Long seasonId) {
        List<Standing> standings = standingRepository.findBySeasonIdOrderByPositionAsc(seasonId);

        List<Team> teams = new ArrayList<>();
        for (Standing standing : standings) {
            if (standing.getTeam() != null) {
                teams.add(standing.getTeam());
            }
        }

        if (!teams.isEmpty()) {
            return teams;
        }

        List<Match> matches = matchRepository.findBySeasonIdOrderByScheduledAtAsc(seasonId);
        List<Long> addedIds = new ArrayList<>();

        for (Match match : matches) {
            if (match.getHomeTeam() != null && !addedIds.contains(match.getHomeTeam().getId())) {
                addedIds.add(match.getHomeTeam().getId());
                teams.add(match.getHomeTeam());
            }

            if (match.getAwayTeam() != null && !addedIds.contains(match.getAwayTeam().getId())) {
                addedIds.add(match.getAwayTeam().getId());
                teams.add(match.getAwayTeam());
            }
        }

        return teams;
    }

    private void clearOldSeededFixtures(Long seasonId) {
        List<Match> matches = matchRepository.findBySeasonIdOrderByScheduledAtAsc(seasonId);

        List<Match> seededMatches = matches.stream()
                .filter(match ->
                        match.getExternalId() != null &&
                                match.getExternalId().startsWith("seed:")
                )
                .toList();

        if (!seededMatches.isEmpty()) {
            matchRepository.deleteAll(seededMatches);
        }
    }

    private int createSeededMatch(
            Season season,
            Team homeTeam,
            Team awayTeam,
            LocalDateTime scheduledAt,
            MatchStatus status,
            Integer homeScore,
            Integer awayScore,
            String venue,
            String roundName,
            String externalId
    ) {
        Match match = new Match();
        match.setSeason(season);
        match.setHomeTeam(homeTeam);
        match.setAwayTeam(awayTeam);
        match.setScheduledAt(scheduledAt);
        match.setStatus(status);
        match.setHomeScore(homeScore);
        match.setAwayScore(awayScore);
        match.setVenue(venue);
        match.setRoundName(roundName);
        match.setExternalId(externalId);

        matchRepository.save(match);
        return 1;
    }
}