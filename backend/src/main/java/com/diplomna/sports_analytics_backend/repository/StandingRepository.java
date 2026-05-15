package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Standing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StandingRepository extends JpaRepository<Standing, Long> {

    List<Standing> findBySeasonIdOrderByPositionAsc(Long seasonId);

    Optional<Standing> findBySeasonIdAndTeamId (Long seasonId, Long teamId);
}
