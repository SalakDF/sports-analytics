package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Season;
import com.diplomna.sports_analytics_backend.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeasonRepository extends JpaRepository<Season, Long> {
    List<Season> findByTournamentId (Long Tournament);

    List <Season> findByIsCurrentTrue();
}
