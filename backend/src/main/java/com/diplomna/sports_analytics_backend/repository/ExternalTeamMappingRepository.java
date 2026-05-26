package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.ExternalTeamMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExternalTeamMappingRepository extends JpaRepository<ExternalTeamMapping, Long> {
    Optional<ExternalTeamMapping> findByExternalTeamId(Long externalTeamId);
}