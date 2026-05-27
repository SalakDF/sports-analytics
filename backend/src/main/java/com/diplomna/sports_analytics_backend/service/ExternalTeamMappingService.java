package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.request.ExternalTeamMappingRequest;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingRowResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingsResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalTeamAutoMapResultResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalTeamMappingResponse;
import com.diplomna.sports_analytics_backend.entity.ExternalTeamMapping;
import com.diplomna.sports_analytics_backend.entity.Team;
import com.diplomna.sports_analytics_backend.repository.ExternalTeamMappingRepository;
import com.diplomna.sports_analytics_backend.repository.TeamRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class ExternalTeamMappingService {

    private final ExternalTeamMappingRepository externalTeamMappingRepository;
    private final TeamRepository teamRepository;
    private final ExternalFootballService externalFootballService;

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9 ]");
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");

    public List<ExternalTeamMappingResponse> getMappings() {
        return externalTeamMappingRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ExternalTeamMappingResponse saveMapping(ExternalTeamMappingRequest request) {
        if (request.getExternalTeamId() == null) {
            throw new RuntimeException("externalTeamId is required");
        }

        if (request.getExternalTeamName() == null || request.getExternalTeamName().isBlank()) {
            throw new RuntimeException("externalTeamName is required");
        }

        if (request.getInternalTeamId() == null) {
            throw new RuntimeException("internalTeamId is required");
        }

        Team internalTeam = teamRepository.findById(request.getInternalTeamId())
                .orElseThrow(() -> new RuntimeException("Internal team not found"));

        ExternalTeamMapping mapping = externalTeamMappingRepository
                .findByExternalTeamId(request.getExternalTeamId())
                .orElse(new ExternalTeamMapping());

        mapping.setExternalTeamId(request.getExternalTeamId());
        mapping.setExternalTeamName(request.getExternalTeamName());
        mapping.setInternalTeamId(internalTeam.getId());
        mapping.setInternalTeamName(internalTeam.getName());
        mapping.setMappedAt(LocalDateTime.now());

        return toResponse(externalTeamMappingRepository.save(mapping));
    }

    public ExternalTeamAutoMapResultResponse autoMapTeamsByCompetition(String competitionCode) {
        if (competitionCode == null || competitionCode.isBlank()) {
            throw new RuntimeException("competitionCode is required");
        }

        ExternalStandingsResponse standings =
                externalFootballService.getCompetitionStandings(competitionCode);

        List<ExternalStandingRowResponse> externalTeams = standings.getRows();
        List<Team> internalTeams = teamRepository.findAll();

        Map<String, List<Team>> internalIndex = buildInternalIndex(internalTeams);

        int mappedCount = 0;
        int alreadyMappedCount = 0;
        int skippedCount = 0;

        for (ExternalStandingRowResponse externalTeam : externalTeams) {
            if (externalTeam.getTeamId() == null || externalTeam.getTeamName() == null) {
                skippedCount++;
                continue;
            }

            if (externalTeamMappingRepository.findByExternalTeamId(externalTeam.getTeamId()).isPresent()) {
                alreadyMappedCount++;
                continue;
            }

            String normalizedExternalName = normalizeTeamName(externalTeam.getTeamName());
            List<Team> candidates = internalIndex.getOrDefault(normalizedExternalName, List.of());

            if (candidates.size() != 1) {
                skippedCount++;
                continue;
            }

            Team matchedTeam = candidates.get(0);

            ExternalTeamMapping mapping = ExternalTeamMapping.builder()
                    .externalTeamId(externalTeam.getTeamId())
                    .externalTeamName(externalTeam.getTeamName())
                    .internalTeamId(matchedTeam.getId())
                    .internalTeamName(matchedTeam.getName())
                    .mappedAt(LocalDateTime.now())
                    .build();

            externalTeamMappingRepository.save(mapping);
            mappedCount++;
        }

        return ExternalTeamAutoMapResultResponse.builder()
                .competitionCode(competitionCode)
                .totalExternalTeams(externalTeams.size())
                .mappedCount(mappedCount)
                .alreadyMappedCount(alreadyMappedCount)
                .skippedCount(skippedCount)
                .build();
    }

    private Map<String, List<Team>> buildInternalIndex(List<Team> internalTeams) {
        Map<String, List<Team>> index = new HashMap<>();

        for (Team team : internalTeams) {
            addToIndex(index, normalizeTeamName(team.getName()), team);

            if (team.getShortName() != null && !team.getShortName().isBlank()) {
                addToIndex(index, normalizeTeamName(team.getShortName()), team);
            }
        }

        return index;
    }

    public void deleteMappingByExternalTeamId(Long externalTeamId) {
        ExternalTeamMapping mapping = externalTeamMappingRepository
                .findByExternalTeamId(externalTeamId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));

        externalTeamMappingRepository.delete(mapping);
    }

    private void addToIndex(Map<String, List<Team>> index, String key, Team team) {
        if (key == null || key.isBlank()) {
            return;
        }

        index.computeIfAbsent(key, ignored -> new ArrayList<>()).add(team);
    }

    private String normalizeTeamName(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.toLowerCase(Locale.ROOT).trim();

        normalized = normalized
                .replace("football club", " ")
                .replace("soccer club", " ")
                .replace("f c ", " ")
                .replace(" fc ", " ")
                .replace(" cf ", " ")
                .replace(" afc ", " ")
                .replace(" sc ", " ")
                .replace(" ac ", " ")
                .replace(" club ", " ");

        normalized = NON_ALNUM.matcher(normalized).replaceAll(" ");
        normalized = MULTI_SPACE.matcher(normalized).replaceAll(" ").trim();

        return normalized;
    }

    private ExternalTeamMappingResponse toResponse(ExternalTeamMapping mapping) {
        return ExternalTeamMappingResponse.builder()
                .id(mapping.getId())
                .externalTeamId(mapping.getExternalTeamId())
                .externalTeamName(mapping.getExternalTeamName())
                .internalTeamId(mapping.getInternalTeamId())
                .internalTeamName(mapping.getInternalTeamName())
                .build();
    }
}