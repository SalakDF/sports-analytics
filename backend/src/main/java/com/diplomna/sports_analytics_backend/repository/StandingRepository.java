package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Standing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StandingRepository extends JpaRepository<Standing, Long> {

    List<Standing> findBySeasonIdOrderByPositionAsc(Long seasonId);

    @Modifying
    @Query("delete from Standing s where s.season.id = :seasonId")
    void deleteAllBySeasonId(@Param("seasonId") Long seasonId);
}