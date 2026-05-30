package com.diplomna.sports_analytics_backend.config;

import com.diplomna.sports_analytics_backend.entity.ExternalCompetitionMapping;
import com.diplomna.sports_analytics_backend.entity.Season;
import com.diplomna.sports_analytics_backend.entity.Tournament;
import com.diplomna.sports_analytics_backend.repository.ExternalCompetitionMappingRepository;
import com.diplomna.sports_analytics_backend.repository.SeasonRepository;
import com.diplomna.sports_analytics_backend.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class LeagueBootstrapConfig {

    private final TournamentRepository tournamentRepository;
    private final SeasonRepository seasonRepository;
    private final ExternalCompetitionMappingRepository externalCompetitionMappingRepository;

    private static final String DIPLOMA_SEASON = "2025/2026";

    @Bean
    public CommandLineRunner bootstrapLeagues() {
        return args -> {
            ensureLeague("PL", "Premier League", "England", DIPLOMA_SEASON);
            ensureLeague("BL1", "Bundesliga", "Germany", DIPLOMA_SEASON);
            ensureLeague("PD", "La Liga", "Spain", DIPLOMA_SEASON);
            ensureLeague("SA", "Serie A", "Italy", DIPLOMA_SEASON);
            ensureLeague("CL", "Champions League", "Europe", DIPLOMA_SEASON);
        };
    }

    private void ensureLeague(
            String externalCode,
            String tournamentName,
            String country,
            String targetSeasonName
    ) {
        Tournament tournament = tournamentRepository.findByName(tournamentName)
                .orElseGet(() -> tournamentRepository.save(
                        Tournament.builder()
                                .name(tournamentName)
                                .country(country)
                                .externalId(externalCode)
                                .build()
                ));

        Season season = resolveSeasonForTournament(tournament, targetSeasonName);
        season.setName(targetSeasonName);
        season.setIsCurrent(true);
        season = seasonRepository.save(season);

        ExternalCompetitionMapping mapping = externalCompetitionMappingRepository
                .findByExternalCompetitionCode(externalCode)
                .orElseGet(() -> ExternalCompetitionMapping.builder()
                        .externalCompetitionCode(externalCode)
                        .build());

        mapping.setExternalCompetitionCode(externalCode);
        mapping.setExternalCompetitionName(tournamentName);
        mapping.setInternalSeasonId(season.getId());
        mapping.setInternalSeasonName(tournamentName + " • " + targetSeasonName);
        mapping.setMappedAt(LocalDateTime.now());

        externalCompetitionMappingRepository.save(mapping);
    }

    private Season resolveSeasonForTournament(Tournament tournament, String targetSeasonName) {
        return seasonRepository.findByNameAndTournamentId(targetSeasonName, tournament.getId())
                .orElseGet(() -> {
                    List<Season> existing = seasonRepository.findAllByTournamentIdOrderByIdAsc(tournament.getId());

                    if (!existing.isEmpty()) {
                        return existing.get(0);
                    }

                    return Season.builder()
                            .name(targetSeasonName)
                            .isCurrent(true)
                            .tournament(tournament)
                            .build();
                });
    }
}