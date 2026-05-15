package com.diplomna.sports_analytics_backend.config;

import com.diplomna.sports_analytics_backend.entity.*;
import com.diplomna.sports_analytics_backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DataSeederConfig {

    @Bean
    CommandLineRunner seedData(
            TournamentRepository tournamentRepository,
            SeasonRepository seasonRepository,
            TeamRepository teamRepository,
            MatchRepository matchRepository,
            StandingRepository standingRepository
    ) {
        return args -> {
            if (tournamentRepository.count() > 0) {
                return;
            }

            Tournament tournament = tournamentRepository.save(
                    Tournament.builder()
                            .name("Premier League")
                            .country("England")
                            .logoUrl("https://example.com/premier-league.png")
                            .externalId("premier-league-2025")
                            .build()
            );

            Season season = seasonRepository.save(
                    Season.builder()
                            .name("2025/2026")
                            .isCurrent(true)
                            .tournament(tournament)
                            .build()
            );

            Team arsenal = teamRepository.save(
                    Team.builder()
                            .name("Arsenal")
                            .shortName("ARS")
                            .country("England")
                            .logoUrl("https://example.com/arsenal.png")
                            .description("Professional football club based in London.")
                            .foundedYear(1886)
                            .externalId("arsenal")
                            .build()
            );

            Team chelsea = teamRepository.save(
                    Team.builder()
                            .name("Chelsea")
                            .shortName("CHE")
                            .country("England")
                            .logoUrl("https://example.com/chelsea.png")
                            .description("Professional football club based in London.")
                            .foundedYear(1905)
                            .externalId("chelsea")
                            .build()
            );

            Team liverpool = teamRepository.save(
                    Team.builder()
                            .name("Liverpool")
                            .shortName("LIV")
                            .country("England")
                            .logoUrl("https://example.com/liverpool.png")
                            .description("Professional football club based in Liverpool.")
                            .foundedYear(1892)
                            .externalId("liverpool")
                            .build()
            );

            Team manCity = teamRepository.save(
                    Team.builder()
                            .name("Manchester City")
                            .shortName("MCI")
                            .country("England")
                            .logoUrl("https://example.com/man-city.png")
                            .description("Professional football club based in Manchester.")
                            .foundedYear(1880)
                            .externalId("manchester-city")
                            .build()
            );

            matchRepository.saveAll(List.of(
                    Match.builder()
                            .season(season)
                            .homeTeam(arsenal)
                            .awayTeam(chelsea)
                            .scheduledAt(LocalDateTime.now().minusDays(3))
                            .status(MatchStatus.FINISHED)
                            .homeScore(2)
                            .awayScore(1)
                            .venue("Emirates Stadium")
                            .roundName("Round 1")
                            .externalId("match-1")
                            .build(),

                    Match.builder()
                            .season(season)
                            .homeTeam(liverpool)
                            .awayTeam(manCity)
                            .scheduledAt(LocalDateTime.now().minusDays(2))
                            .status(MatchStatus.FINISHED)
                            .homeScore(1)
                            .awayScore(1)
                            .venue("Anfield")
                            .roundName("Round 1")
                            .externalId("match-2")
                            .build(),

                    Match.builder()
                            .season(season)
                            .homeTeam(chelsea)
                            .awayTeam(liverpool)
                            .scheduledAt(LocalDateTime.now().plusDays(2))
                            .status(MatchStatus.SCHEDULED)
                            .homeScore(null)
                            .awayScore(null)
                            .venue("Stamford Bridge")
                            .roundName("Round 2")
                            .externalId("match-3")
                            .build(),

                    Match.builder()
                            .season(season)
                            .homeTeam(manCity)
                            .awayTeam(arsenal)
                            .scheduledAt(LocalDateTime.now().plusDays(3))
                            .status(MatchStatus.SCHEDULED)
                            .homeScore(null)
                            .awayScore(null)
                            .venue("Etihad Stadium")
                            .roundName("Round 2")
                            .externalId("match-4")
                            .build()
            ));

            standingRepository.saveAll(List.of(
                    Standing.builder()
                            .season(season)
                            .team(arsenal)
                            .position(1)
                            .played(1)
                            .wins(1)
                            .draws(0)
                            .losses(0)
                            .goalsFor(2)
                            .goalsAgainst(1)
                            .goalDifference(1)
                            .points(3)
                            .build(),

                    Standing.builder()
                            .season(season)
                            .team(liverpool)
                            .position(2)
                            .played(1)
                            .wins(0)
                            .draws(1)
                            .losses(0)
                            .goalsFor(1)
                            .goalsAgainst(1)
                            .goalDifference(0)
                            .points(1)
                            .build(),

                    Standing.builder()
                            .season(season)
                            .team(manCity)
                            .position(3)
                            .played(1)
                            .wins(0)
                            .draws(1)
                            .losses(0)
                            .goalsFor(1)
                            .goalsAgainst(1)
                            .goalDifference(0)
                            .points(1)
                            .build(),

                    Standing.builder()
                            .season(season)
                            .team(chelsea)
                            .position(4)
                            .played(1)
                            .wins(0)
                            .draws(0)
                            .losses(1)
                            .goalsFor(1)
                            .goalsAgainst(2)
                            .goalDifference(-1)
                            .points(0)
                            .build()
            ));
        };
    }
}
