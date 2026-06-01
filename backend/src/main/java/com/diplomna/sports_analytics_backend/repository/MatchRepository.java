package com.diplomna.sports_analytics_backend.repository;

import com.diplomna.sports_analytics_backend.entity.Match;
import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findAllByOrderByScheduledAtDesc();

    List<Match> findAllByStatusOrderByScheduledAtDesc(MatchStatus status);

    @Query("""
            select distinct m
            from Match m
            join m.season s
            join s.tournament t
            join m.homeTeam ht
            join m.awayTeam at
            where lower(ht.name) like lower(concat('%', :search, '%'))
               or lower(at.name) like lower(concat('%', :search, '%'))
               or lower(t.name) like lower(concat('%', :search, '%'))
            order by m.scheduledAt desc
            """)
    List<Match> searchMatches(@Param("search") String search);

    @Query("""
            select distinct m
            from Match m
            join m.season s
            join s.tournament t
            join m.homeTeam ht
            join m.awayTeam at
            where (
                    lower(ht.name) like lower(concat('%', :search, '%'))
                 or lower(at.name) like lower(concat('%', :search, '%'))
                 or lower(t.name) like lower(concat('%', :search, '%'))
            )
            and m.status = :status
            order by m.scheduledAt desc
            """)
    List<Match> searchMatchesByStatus(
            @Param("search") String search,
            @Param("status") MatchStatus status
    );

    @Query("""
            select m
            from Match m
            where (m.homeTeam.id = :teamId or m.awayTeam.id = :teamId)
            order by m.scheduledAt desc
            """)
    List<Match> findRecentMatchesByTeamId(@Param("teamId") Long teamId);

    @Query("""
            select m
            from Match m
            where (m.homeTeam.id = :teamId or m.awayTeam.id = :teamId)
              and m.status = com.diplomna.sports_analytics_backend.entity.MatchStatus.FINISHED
            order by m.scheduledAt desc
            """)
    List<Match> findRecentFinishedMatchesByTeamId(@Param("teamId") Long teamId);

    @Query("""
            select m
            from Match m
            where (m.homeTeam.id = :teamId or m.awayTeam.id = :teamId)
              and m.status = com.diplomna.sports_analytics_backend.entity.MatchStatus.FINISHED
            order by m.scheduledAt desc
            """)
    List<Match> findFinishedMatchesByTeamId(@Param("teamId") Long teamId);

    @Query("""
            select m
            from Match m
            where (
                    (m.homeTeam.id = :homeTeamId and m.awayTeam.id = :awayTeamId)
                 or (m.homeTeam.id = :awayTeamId and m.awayTeam.id = :homeTeamId)
            )
              and m.status = com.diplomna.sports_analytics_backend.entity.MatchStatus.FINISHED
            order by m.scheduledAt desc
            """)
    List<Match> findHeadToHeadFinishedMatches(
            @Param("homeTeamId") Long homeTeamId,
            @Param("awayTeamId") Long awayTeamId
    );

    List<Match> findBySeasonIdOrderByScheduledAtAsc(Long seasonId);
}
