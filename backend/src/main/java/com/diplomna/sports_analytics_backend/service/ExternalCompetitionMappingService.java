package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.request.ExternalCompetitionMappingRequest;
import com.diplomna.sports_analytics_backend.dto.response.ExternalCompetitionMappingResponse;
import com.diplomna.sports_analytics_backend.entity.ExternalCompetitionMapping;
import com.diplomna.sports_analytics_backend.entity.Season;
import com.diplomna.sports_analytics_backend.repository.ExternalCompetitionMappingRepository;
import com.diplomna.sports_analytics_backend.repository.SeasonRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExternalCompetitionMappingService {

    private final ExternalCompetitionMappingRepository externalCompetitionMappingRepository;
    private final SeasonRepository seasonRepository;

    public List<ExternalCompetitionMappingResponse> getMappings() {
        return externalCompetitionMappingRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ExternalCompetitionMappingResponse saveMapping(ExternalCompetitionMappingRequest request) {
        if (request.getExternalCompetitionCode() == null || request.getExternalCompetitionCode().isBlank()) {
            throw new RuntimeException("externalCompetitionCode is required");
        }

        if (request.getExternalCompetitionName() == null || request.getExternalCompetitionName().isBlank()) {
            throw new RuntimeException("externalCompetitionName is required");
        }

        if (request.getInternalSeasonId() == null) {
            throw new RuntimeException("internalSeasonId is required");
        }

        Season season = seasonRepository.findById(request.getInternalSeasonId())
                .orElseThrow(() -> new RuntimeException("Internal season not found"));

        ExternalCompetitionMapping mapping = externalCompetitionMappingRepository
                .findByExternalCompetitionCode(request.getExternalCompetitionCode())
                .orElse(new ExternalCompetitionMapping());

        mapping.setExternalCompetitionCode(request.getExternalCompetitionCode());
        mapping.setExternalCompetitionName(request.getExternalCompetitionName());
        mapping.setInternalSeasonId(season.getId());
        mapping.setInternalSeasonName(season.getName());
        mapping.setMappedAt(LocalDateTime.now());

        return toResponse(externalCompetitionMappingRepository.save(mapping));
    }

    private ExternalCompetitionMappingResponse toResponse(ExternalCompetitionMapping mapping) {
        return ExternalCompetitionMappingResponse.builder()
                .id(mapping.getId())
                .externalCompetitionCode(mapping.getExternalCompetitionCode())
                .externalCompetitionName(mapping.getExternalCompetitionName())
                .internalSeasonId(mapping.getInternalSeasonId())
                .internalSeasonName(mapping.getInternalSeasonName())
                .build();
    }
}