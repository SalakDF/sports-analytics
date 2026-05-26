package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Match;
import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findAllByOrderByScheduledAtDesc();

    @Query("""
            select distinct m
            from Match m
            join m.season s
            join s.tournament t
            join m.homeTeam ht
            join m.awayTeam at
            where (:search is null
                   or lower(ht.name) like lower(concat('%', :search, '%'))
                   or lower(at.name) like lower(concat('%', :search, '%'))
                   or lower(t.name) like lower(concat('%', :search, '%')))
              and (:status is null or m.status = :status)
            order by m.scheduledAt desc
            """)
    List<Match> searchMatches(
            @Param("search") String search,
            @Param("status") MatchStatus status
    );
}