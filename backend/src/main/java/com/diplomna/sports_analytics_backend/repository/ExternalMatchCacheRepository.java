package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.ExternalMatchCache;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExternalMatchCacheRepository extends JpaRepository<ExternalMatchCache, Long> {

    Optional<ExternalMatchCache> findByExternalId(Long externalId);

    List<ExternalMatchCache> findAllByCompetitionCodeOrderByUtcDateDesc(String competitionCode);

    List<ExternalMatchCache> findAllByOrderByUtcDateDesc();
}