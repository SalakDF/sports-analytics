package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeasonRepository extends JpaRepository<Season, Long> {
    List<Season> findAllByOrderByIdDesc();

    Optional<Season> findByNameAndTournamentId(String name, Long tournamentId);

    List<Season> findAllByTournamentIdOrderByIdAsc(Long tournamentId);
}