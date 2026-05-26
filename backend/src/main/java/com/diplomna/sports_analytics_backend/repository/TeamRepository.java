package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findAllByOrderByNameAsc();

    List<Team> findByNameContainingIgnoreCaseOrShortNameContainingIgnoreCaseOrCountryContainingIgnoreCaseOrderByNameAsc(
            String name,
            String shortName,
            String country
    );
}