package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.ExternalCompetitionMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExternalCompetitionMappingRepository
        extends JpaRepository<ExternalCompetitionMapping, Long> {

    Optional<ExternalCompetitionMapping> findByExternalCompetitionCode(String externalCompetitionCode);
}