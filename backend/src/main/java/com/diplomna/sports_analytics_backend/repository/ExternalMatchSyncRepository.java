package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.ExternalMatchSync;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExternalMatchSyncRepository extends JpaRepository<ExternalMatchSync, Long> {
    Optional<ExternalMatchSync> findByExternalMatchId(Long externalMatchId);
}