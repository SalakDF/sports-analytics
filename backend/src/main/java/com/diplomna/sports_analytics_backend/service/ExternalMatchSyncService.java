package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.request.ExternalMatchSyncRequest;
import com.diplomna.sports_analytics_backend.dto.response.ExternalMatchSyncResultResponse;
import com.diplomna.sports_analytics_backend.dto.response.ImportResultResponse;
import com.diplomna.sports_analytics_backend.entity.*;
import com.diplomna.sports_analytics_backend.repository.*;
import com.diplomna.sports_analytics_backend.util.TeamNameSanitizer;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Locale;
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
    private final StandingRebuildService standingRebuildService;
    private final ApiFootballScoreEnrichmentService apiFootballScoreEnrichmentService;
    private final FootballDataScoreEnrichmentService footballDataScoreEnrichmentService;

    private List<Team> allTeamsCache = null;

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

        ImportResultResponse importResult;
        try {
            importResult = externalImportService.importCompetitionMatches(request.getCompetitionCode());
        } catch (Exception ex) {
            importResult = ImportResultResponse.builder()
                    .competitionCode(request.getCompetitionCode())
                    .importedCount(0)
                    .updatedCount(0)
                    .totalCount(0)
                    .build();
        }

        List<ExternalMatchCache> cachedMatches =
                externalMatchCacheRepository.findAllByCompetitionCodeOrderByUtcDateDesc(
                        request.getCompetitionCode()
                );

        int createdInternalCount = 0;
        int updatedInternalCount = 0;
        int skippedCount = 0;

        for (ExternalMatchCache cachedMatch : cachedMatches) {
            try {
                Team homeTeam = resolveTeam(cachedMatch.getHomeTeamId(), cachedMatch.getHomeTeamName());
                Team awayTeam = resolveTeam(cachedMatch.getAwayTeamId(), cachedMatch.getAwayTeamName());

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

                LocalDateTime scheduledAt = parseUtcDate(cachedMatch.getUtcDate());
                if (scheduledAt == null) {
                    skippedCount++;
                    continue;
                }

                match.setSeason(season);
                match.setHomeTeam(homeTeam);
                match.setAwayTeam(awayTeam);
                match.setScheduledAt(scheduledAt);

            MatchStatus resolvedStatus = mapExternalStatus(cachedMatch.getStatus());
            Integer incomingHomeScore = cachedMatch.getHomeScore();
            Integer incomingAwayScore = cachedMatch.getAwayScore();

            boolean hasIncomingScore = incomingHomeScore != null && incomingAwayScore != null;
            boolean hasExistingScore = match.getHomeScore() != null && match.getAwayScore() != null;

            if (!hasIncomingScore && cachedMatch.getUtcDate() != null) {
                var enriched = apiFootballScoreEnrichmentService.findScore(
                        request.getCompetitionCode(),
                        cachedMatch.getUtcDate(),
                        cachedMatch.getHomeTeamName(),
                        cachedMatch.getAwayTeamName()
                );

                if (enriched.isPresent()) {
                    incomingHomeScore = enriched.get().getHomeScore();
                    incomingAwayScore = enriched.get().getAwayScore();
                    hasIncomingScore = incomingHomeScore != null && incomingAwayScore != null;

                    if (hasIncomingScore) {
                        cachedMatch.setHomeScore(incomingHomeScore);
                        cachedMatch.setAwayScore(incomingAwayScore);
                        externalMatchCacheRepository.save(cachedMatch);
                    }

                    if (resolvedStatus == MatchStatus.SCHEDULED) {
                        String shortStatus = enriched.get().getExternalStatusShort();
                        MatchStatus mappedFromShort = mapApiFootballShortStatus(shortStatus);
                        if (mappedFromShort != MatchStatus.SCHEDULED) {
                            resolvedStatus = mappedFromShort;
                        }
                    }
                }
            }

            if (!hasIncomingScore && cachedMatch.getUtcDate() != null) {
                var fallback = footballDataScoreEnrichmentService.findScore(
                        request.getCompetitionCode(),
                        cachedMatch.getUtcDate(),
                        cachedMatch.getHomeTeamName(),
                        cachedMatch.getAwayTeamName()
                );

                if (fallback.isPresent()) {
                    incomingHomeScore = fallback.get().getHomeScore();
                    incomingAwayScore = fallback.get().getAwayScore();
                    hasIncomingScore = incomingHomeScore != null && incomingAwayScore != null;

                    if (hasIncomingScore) {
                        cachedMatch.setHomeScore(incomingHomeScore);
                        cachedMatch.setAwayScore(incomingAwayScore);
                        externalMatchCacheRepository.save(cachedMatch);
                    }

                    if (resolvedStatus == MatchStatus.SCHEDULED) {
                        MatchStatus mappedFromFallback = mapFootballDataStatus(fallback.get().getExternalStatus());
                        if (mappedFromFallback != MatchStatus.SCHEDULED) {
                            resolvedStatus = mappedFromFallback;
                        }
                    }
                }
            }

            boolean kickoffLongAgo = match.getScheduledAt() != null
                    && match.getScheduledAt().isBefore(LocalDateTime.now().minusHours(6));

            // Guardrail: never mark finished without a score from external feed.
            if (resolvedStatus == MatchStatus.FINISHED && !hasIncomingScore) {
                if (match.getStatus() == MatchStatus.FINISHED && hasExistingScore) {
                    resolvedStatus = MatchStatus.FINISHED;
                } else if (kickoffLongAgo) {
                    // External feed can lag with score details: keep finished for old fixtures.
                    resolvedStatus = MatchStatus.FINISHED;
                } else {
                    resolvedStatus = MatchStatus.SCHEDULED;
                }
            }

            match.setStatus(resolvedStatus);

            // Do not wipe valid existing score if external payload temporarily returns nulls.
            if (hasIncomingScore) {
                match.setHomeScore(incomingHomeScore);
                match.setAwayScore(incomingAwayScore);
            } else if (!hasExistingScore) {
                match.setHomeScore(null);
                match.setAwayScore(null);
            }

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
            } catch (Exception ex) {
                skippedCount++;
            }
        }

        standingRebuildService.rebuildSeasonStandings(resolvedSeasonId);

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
            return OffsetDateTime.parse(utcDate)
                    .atZoneSameInstant(ZoneId.systemDefault())
                    .toLocalDateTime();
        } catch (Exception e) {
            return null;
        }
    }

    private MatchStatus mapExternalStatus(String externalStatus) {
        if (externalStatus == null || externalStatus.isBlank()) {
            return MatchStatus.SCHEDULED;
        }

        return switch (externalStatus) {
            case "FINISHED", "AWARDED" -> MatchStatus.FINISHED;
            case "LIVE", "IN_PLAY", "PAUSED" -> MatchStatus.LIVE;
            case "POSTPONED" -> MatchStatus.POSTPONED;
            case "CANCELED" -> MatchStatus.CANCELED;
            default -> MatchStatus.SCHEDULED;
        };
    }

    private MatchStatus mapApiFootballShortStatus(String shortStatus) {
        if (shortStatus == null || shortStatus.isBlank()) {
            return MatchStatus.SCHEDULED;
        }

        return switch (shortStatus) {
            case "FT", "AET", "PEN", "WO" -> MatchStatus.FINISHED;
            case "1H", "2H", "HT", "ET", "BT", "P" -> MatchStatus.LIVE;
            case "PST", "SUSP", "INT", "ABD" -> MatchStatus.POSTPONED;
            case "CANC" -> MatchStatus.CANCELED;
            default -> MatchStatus.SCHEDULED;
        };
    }

    private MatchStatus mapFootballDataStatus(String externalStatus) {
        if (externalStatus == null || externalStatus.isBlank()) {
            return MatchStatus.SCHEDULED;
        }

        return switch (externalStatus) {
            case "FINISHED", "AWARDED" -> MatchStatus.FINISHED;
            case "IN_PLAY", "PAUSED", "LIVE" -> MatchStatus.LIVE;
            case "POSTPONED", "SUSPENDED" -> MatchStatus.POSTPONED;
            case "CANCELED" -> MatchStatus.CANCELED;
            default -> MatchStatus.SCHEDULED;
        };
    }

    private Team resolveTeam(Long externalTeamId, String externalTeamName) {
        if (externalTeamId == null) {
            return resolveTeamByName(externalTeamName);
        }

        ExternalTeamMapping mapping = externalTeamMappingRepository
                .findByExternalTeamId(externalTeamId)
                .orElse(null);

        if (mapping != null) {
            Team mappedTeam = teamRepository.findById(mapping.getInternalTeamId()).orElse(null);
            if (mappedTeam != null) {
                return mappedTeam;
            }
        }

        return resolveTeamByName(externalTeamName);
    }

    private Team resolveTeamByName(String externalTeamName) {
        if (externalTeamName == null || externalTeamName.isBlank()) {
            return null;
        }

        if (allTeamsCache == null) {
            allTeamsCache = teamRepository.findAll();
        }

        String target = TeamNameSanitizer.normalizeName(externalTeamName).toLowerCase(Locale.ROOT);

        for (Team team : allTeamsCache) {
            String candidate = TeamNameSanitizer.normalizeName(team.getName()).toLowerCase(Locale.ROOT);
            if (candidate.equals(target)) {
                return team;
            }
        }

        return null;
    }
}
