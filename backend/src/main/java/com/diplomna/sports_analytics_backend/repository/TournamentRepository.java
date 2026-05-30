package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    Optional<Tournament> findByName(String name);
}