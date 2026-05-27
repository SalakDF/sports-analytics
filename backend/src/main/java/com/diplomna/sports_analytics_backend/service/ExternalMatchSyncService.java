package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.request.ExternalMatchSyncRequest;
import com.diplomna.sports_analytics_backend.dto.response.ExternalMatchSyncResultResponse;
import com.diplomna.sports_analytics_backend.dto.response.ImportResultResponse;
import com.diplomna.sports_analytics_backend.entity.*;
import com.diplomna.sports_analytics_backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExternalMatchSyncService {

    private final ExternalImportService externalImportService;
    private final ExternalMatchCacheRepository externalMatchCacheRepository;
    private final ExternalTeamMappingRepository externalTeamMappingRepository;
    private final ExternalCompetitionMappingRepository externalCompetitionMappingRepository;
    private final ExternalMatchSyncRepository externalMatchSyncRepository;
    private final SeasonRepository seasonRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public ExternalMatchSyncResultResponse syncMatches(ExternalMatchSyncRequest request) {
        if (request.getCompetitionCode() == null || request.getCompetitionCode().isBlank()) {
            throw new RuntimeException("competitionCode is required");
        }

        Long resolvedSeasonId = request.getSeasonId();

        if (resolvedSeasonId == null) {
            ExternalCompetitionMapping mapping = externalCompetitionMappingRepository
                    .findByExternalCompetitionCode(request.getCompetitionCode())
                    .orElseThrow(() -> new RuntimeException(
                            "No competition mapping found for code: " + request.getCompetitionCode()
                    ));

            resolvedSeasonId = mapping.getInternalSeasonId();
        }

        Season season = seasonRepository.findById(resolvedSeasonId)
                .orElseThrow(() -> new RuntimeException("Season not found"));

        ImportResultResponse importResult =
                externalImportService.importCompetitionMatches(request.getCompetitionCode());

        List<ExternalMatchCache> cachedMatches =
                externalMatchCacheRepository.findAllByCompetitionCodeOrderByUtcDateDesc(
                        request.getCompetitionCode()
                );

        int createdInternalCount = 0;
        int updatedInternalCount = 0;
        int skippedCount = 0;

        for (ExternalMatchCache cachedMatch : cachedMatches) {
            ExternalTeamMapping homeMapping = externalTeamMappingRepository
                    .findByExternalTeamId(cachedMatch.getHomeTeamId())
                    .orElse(null);

            ExternalTeamMapping awayMapping = externalTeamMappingRepository
                    .findByExternalTeamId(cachedMatch.getAwayTeamId())
                    .orElse(null);

            if (homeMapping == null || awayMapping == null) {
                skippedCount++;
                continue;
            }

            Team homeTeam = teamRepository.findById(homeMapping.getInternalTeamId()).orElse(null);
            Team awayTeam = teamRepository.findById(awayMapping.getInternalTeamId()).orElse(null);

            if (homeTeam == null || awayTeam == null) {
                skippedCount++;
                continue;
            }

            if (homeTeam.getId().equals(awayTeam.getId())) {
                skippedCount++;
                continue;
            }

            ExternalMatchSync syncRecord = externalMatchSyncRepository
                    .findByExternalMatchId(cachedMatch.getExternalId())
                    .orElse(null);

            Match match;
            boolean isNew = false;

            if (syncRecord == null) {
                match = new Match();
                isNew = true;
            } else {
                match = matchRepository.findById(syncRecord.getInternalMatchId()).orElse(new Match());
                if (match.getId() == null) {
                    isNew = true;
                }
            }

            match.setSeason(season);
            match.setHomeTeam(homeTeam);
            match.setAwayTeam(awayTeam);
            match.setScheduledAt(parseUtcDate(cachedMatch.getUtcDate()));
            match.setStatus(mapExternalStatus(cachedMatch.getStatus()));
            match.setHomeScore(cachedMatch.getHomeScore());
            match.setAwayScore(cachedMatch.getAwayScore());
            match.setVenue("External API");
            match.setRoundName(cachedMatch.getCompetitionCode());

            Match savedMatch = matchRepository.save(match);

            if (isNew) {
                createdInternalCount++;
            } else {
                updatedInternalCount++;
            }

            if (syncRecord == null) {
                syncRecord = new ExternalMatchSync();
                syncRecord.setExternalMatchId(cachedMatch.getExternalId());
            }

            syncRecord.setInternalMatchId(savedMatch.getId());
            syncRecord.setCompetitionCode(cachedMatch.getCompetitionCode());
            syncRecord.setSyncedAt(LocalDateTime.now());

            externalMatchSyncRepository.save(syncRecord);
        }

        return ExternalMatchSyncResultResponse.builder()
                .competitionCode(request.getCompetitionCode())
                .seasonId(resolvedSeasonId)
                .refreshedExternalCount(importResult.getTotalCount())
                .createdInternalCount(createdInternalCount)
                .updatedInternalCount(updatedInternalCount)
                .skippedCount(skippedCount)
                .build();
    }

    private LocalDateTime parseUtcDate(String utcDate) {
        if (utcDate == null || utcDate.isBlank()) {
            return null;
        }

        try {
            return OffsetDateTime.parse(utcDate).toLocalDateTime();
        } catch (Exception e) {
            return null;
        }
    }

    private MatchStatus mapExternalStatus(String externalStatus) {
        if (externalStatus == null || externalStatus.isBlank()) {
            return MatchStatus.SCHEDULED;
        }

        return switch (externalStatus) {
            case "FINISHED" -> MatchStatus.FINISHED;
            case "IN_PLAY", "PAUSED" -> MatchStatus.LIVE;
            case "POSTPONED" -> MatchStatus.POSTPONED;
            case "CANCELED" -> MatchStatus.CANCELED;
            default -> MatchStatus.SCHEDULED;
        };
    }
}