package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.FavoriteMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteMatchRepository extends JpaRepository<FavoriteMatch, Long> {
    List<FavoriteMatch> findByUserId(Long userId);
    Optional<FavoriteMatch> findByUserIdAndMatchId(Long userId, Long matchId);
    void deleteByUserIdAndMatchId(Long userId, Long matchId);
}
