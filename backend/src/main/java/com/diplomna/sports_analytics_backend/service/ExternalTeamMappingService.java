package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.request.ExternalTeamMappingRequest;
import com.diplomna.sports_analytics_backend.dto.response.ExternalTeamMappingResponse;
import com.diplomna.sports_analytics_backend.entity.ExternalTeamMapping;
import com.diplomna.sports_analytics_backend.entity.Team;
import com.diplomna.sports_analytics_backend.repository.ExternalTeamMappingRepository;
import com.diplomna.sports_analytics_backend.repository.TeamRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExternalTeamMappingService {

    private final ExternalTeamMappingRepository externalTeamMappingRepository;
    private final TeamRepository teamRepository;

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