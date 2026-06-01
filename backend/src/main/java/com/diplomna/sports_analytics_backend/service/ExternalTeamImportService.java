package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingRowResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingsResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalTeamImportResultResponse;
import com.diplomna.sports_analytics_backend.dto.response.TeamNameCleanupResponse;
import com.diplomna.sports_analytics_backend.entity.Team;
import com.diplomna.sports_analytics_backend.repository.TeamRepository;
import com.diplomna.sports_analytics_backend.util.TeamNameSanitizer;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExternalTeamImportService {

    private final ExternalFootballService externalFootballService;
    private final TeamRepository teamRepository;

    public ExternalTeamImportResultResponse importMissingTeams(String competitionCode) {
        if (competitionCode == null || competitionCode.isBlank()) {
            throw new RuntimeException("competitionCode is required");
        }

        ExternalStandingsResponse standings =
                externalFootballService.getCompetitionStandings(competitionCode);

        List<ExternalStandingRowResponse> externalTeams = standings.getRows();
        List<Team> existingTeams = teamRepository.findAll();

        int createdTeams = 0;
        int alreadyExistingTeams = 0;

        for (ExternalStandingRowResponse externalTeam : externalTeams) {
            if (externalTeam.getTeamName() == null || externalTeam.getTeamName().isBlank()) {
                continue;
            }

            String normalizedExternalName = TeamNameSanitizer.normalizeName(externalTeam.getTeamName());

            Team existingTeam = existingTeams.stream()
                    .filter(team -> TeamNameSanitizer.normalizeName(team.getName()).equals(normalizedExternalName))
                    .findFirst()
                    .orElse(null);

            if (existingTeam != null) {
                String sanitizedName = TeamNameSanitizer.sanitizeDisplayName(existingTeam.getName());
                String sanitizedShortName = TeamNameSanitizer.buildShortName(existingTeam.getName());
                if (!sanitizedName.equals(existingTeam.getName())
                        || existingTeam.getShortName() == null
                        || existingTeam.getShortName().isBlank()
                        || !sanitizedShortName.equals(existingTeam.getShortName())) {
                    existingTeam.setName(sanitizedName);
                    existingTeam.setShortName(sanitizedShortName);
                    teamRepository.save(existingTeam);
                }
                alreadyExistingTeams++;
                continue;
            }

            Team team = new Team();
            String sanitizedName = TeamNameSanitizer.sanitizeDisplayName(externalTeam.getTeamName());
            team.setName(sanitizedName);
            team.setShortName(TeamNameSanitizer.buildShortName(sanitizedName));
            team.setCountry(resolveCountryByCompetition(competitionCode));
            team.setDescription("Imported from API-Football");

            Team saved = teamRepository.save(team);
            existingTeams.add(saved);
            createdTeams++;
        }

        return ExternalTeamImportResultResponse.builder()
                .competitionCode(competitionCode)
                .totalExternalTeams(externalTeams.size())
                .createdTeams(createdTeams)
                .alreadyExistingTeams(alreadyExistingTeams)
                .build();
    }

    public TeamNameCleanupResponse cleanupAllTeamNames() {
        List<Team> teams = teamRepository.findAll();
        List<Team> changedTeams = new ArrayList<>();
        int updated = 0;

        for (Team team : teams) {
            String sanitizedName = TeamNameSanitizer.sanitizeDisplayName(team.getName());
            String sanitizedShortName = TeamNameSanitizer.buildShortName(
                    team.getShortName() != null && !team.getShortName().isBlank()
                            ? team.getShortName()
                            : sanitizedName
            );

            boolean needsUpdate = !sanitizedName.equals(team.getName())
                    || team.getShortName() == null
                    || team.getShortName().isBlank()
                    || !sanitizedShortName.equals(team.getShortName());

            if (!needsUpdate) {
                continue;
            }

            team.setName(sanitizedName);
            team.setShortName(sanitizedShortName);
            changedTeams.add(team);
            updated++;
        }

        if (!changedTeams.isEmpty()) {
            teamRepository.saveAll(changedTeams);
        }

        return TeamNameCleanupResponse.builder()
                .totalTeams(teams.size())
                .updatedTeams(updated)
                .build();
    }

    private String resolveCountryByCompetition(String competitionCode) {
        return switch (competitionCode) {
            case "PL" -> "England";
            case "BL1" -> "Germany";
            case "PD" -> "Spain";
            case "SA" -> "Italy";
            case "CL" -> "Europe";
            default -> null;
        };
    }

}
