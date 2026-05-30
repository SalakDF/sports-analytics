package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingRowResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingsResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalTeamImportResultResponse;
import com.diplomna.sports_analytics_backend.entity.Team;
import com.diplomna.sports_analytics_backend.repository.TeamRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class ExternalTeamImportService {

    private final ExternalFootballService externalFootballService;
    private final TeamRepository teamRepository;

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9 ]");
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");

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

            String normalizedExternalName = normalizeName(externalTeam.getTeamName());

            boolean exists = existingTeams.stream().anyMatch(team ->
                    normalizeName(team.getName()).equals(normalizedExternalName)
            );

            if (exists) {
                alreadyExistingTeams++;
                continue;
            }

            Team team = new Team();
            team.setName(externalTeam.getTeamName());
            team.setShortName(buildShortName(externalTeam.getTeamName()));
            team.setCountry(resolveCountryByCompetition(competitionCode));
            team.setDescription("Imported from football-data.org");

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

    private String buildShortName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }

        String cleaned = name
                .replace("Football Club", "")
                .replace("FC", "")
                .replace("AFC", "")
                .trim();

        if (cleaned.length() <= 12) {
            return cleaned;
        }

        return cleaned.substring(0, 12).trim();
    }

    private String normalizeName(String value) {
        String normalized = value.toLowerCase(Locale.ROOT).trim();

        normalized = normalized
                .replace("football club", " ")
                .replace("soccer club", " ")
                .replace(" fc ", " ")
                .replace(" afc ", " ")
                .replace(" cf ", " ")
                .replace(" sc ", " ")
                .replace(" ac ", " ")
                .replace(" club ", " ");

        normalized = NON_ALNUM.matcher(normalized).replaceAll(" ");
        normalized = MULTI_SPACE.matcher(normalized).replaceAll(" ").trim();

        return normalized;
    }
}