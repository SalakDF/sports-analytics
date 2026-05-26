package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.ExternalMatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.ImportResultResponse;
import com.diplomna.sports_analytics_backend.entity.ExternalMatchCache;
import com.diplomna.sports_analytics_backend.repository.ExternalMatchCacheRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExternalImportService {

    private final ExternalFootballService externalFootballService;
    private final ExternalMatchCacheRepository externalMatchCacheRepository;

    public ImportResultResponse importCompetitionMatches(String competitionCode) {
        List<ExternalMatchResponse> externalMatches =
                externalFootballService.getCompetitionMatches(competitionCode);

        int importedCount = 0;
        int updatedCount = 0;

        for (ExternalMatchResponse match : externalMatches) {
            ExternalMatchCache entity = externalMatchCacheRepository
                    .findByExternalId(match.getId())
                    .orElse(null);

            if (entity == null) {
                entity = new ExternalMatchCache();
                entity.setExternalId(match.getId());
                importedCount++;
            } else {
                updatedCount++;
            }

            entity.setCompetitionCode(match.getCompetitionCode());
            entity.setCompetitionName(match.getCompetitionName());
            entity.setUtcDate(match.getUtcDate());
            entity.setStatus(match.getStatus());

            entity.setHomeTeamId(match.getHomeTeamId());
            entity.setHomeTeamName(match.getHomeTeamName());

            entity.setAwayTeamId(match.getAwayTeamId());
            entity.setAwayTeamName(match.getAwayTeamName());

            entity.setHomeScore(match.getHomeScore());
            entity.setAwayScore(match.getAwayScore());

            entity.setImportedAt(LocalDateTime.now());

            externalMatchCacheRepository.save(entity);
        }

        return ImportResultResponse.builder()
                .competitionCode(competitionCode)
                .importedCount(importedCount)
                .updatedCount(updatedCount)
                .totalCount(externalMatches.size())
                .build();
    }

    public List<ExternalMatchResponse> getImportedMatches(String competitionCode) {
        List<ExternalMatchCache> matches;

        if (competitionCode == null || competitionCode.isBlank()) {
            matches = externalMatchCacheRepository.findAllByOrderByUtcDateDesc();
        } else {
            matches = externalMatchCacheRepository
                    .findAllByCompetitionCodeOrderByUtcDateDesc(competitionCode);
        }

        return matches.stream()
                .map(this::toResponse)
                .toList();
    }

    private ExternalMatchResponse toResponse(ExternalMatchCache match) {
        return ExternalMatchResponse.builder()
                .id(match.getExternalId())
                .competitionCode(match.getCompetitionCode())
                .competitionName(match.getCompetitionName())
                .utcDate(match.getUtcDate())
                .status(match.getStatus())
                .homeTeamId(match.getHomeTeamId())
                .homeTeamName(match.getHomeTeamName())
                .awayTeamId(match.getAwayTeamId())
                .awayTeamName(match.getAwayTeamName())
                .homeScore(match.getHomeScore())
                .awayScore(match.getAwayScore())
                .build();
    }
}