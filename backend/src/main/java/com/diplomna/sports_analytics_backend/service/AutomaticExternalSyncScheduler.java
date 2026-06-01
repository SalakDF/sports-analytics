package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.request.ExternalMatchSyncRequest;
import com.diplomna.sports_analytics_backend.entity.ExternalCompetitionMapping;
import com.diplomna.sports_analytics_backend.repository.ExternalCompetitionMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutomaticExternalSyncScheduler {

    private final ExternalCompetitionMappingRepository competitionMappingRepository;
    private final ExternalMatchSyncService externalMatchSyncService;
    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);

    @Scheduled(
            initialDelayString = "${sports.sync.auto.initial-delay-ms:45000}",
            fixedDelayString = "${sports.sync.auto.fixed-delay-ms:180000}"
    )
    public void runAutomaticSync() {
        if (!syncInProgress.compareAndSet(false, true)) {
            return;
        }

        try {
            List<ExternalCompetitionMapping> mappings = competitionMappingRepository.findAll();
            for (ExternalCompetitionMapping mapping : mappings) {
                if (mapping.getExternalCompetitionCode() == null || mapping.getExternalCompetitionCode().isBlank()) {
                    continue;
                }

                ExternalMatchSyncRequest request = new ExternalMatchSyncRequest();
                request.setCompetitionCode(mapping.getExternalCompetitionCode());
                request.setSeasonId(mapping.getInternalSeasonId());

                try {
                    externalMatchSyncService.syncMatches(request);
                } catch (Exception ex) {
                    log.warn("Auto sync failed for competition code {}", mapping.getExternalCompetitionCode(), ex);
                }
            }
        } finally {
            syncInProgress.set(false);
        }
    }
}

