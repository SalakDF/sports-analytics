package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.response.MatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.TeamResponse;
import com.diplomna.sports_analytics_backend.dto.response.TeamStatsResponse;
import com.diplomna.sports_analytics_backend.service.MatchService;
import com.diplomna.sports_analytics_backend.service.TeamService;
import com.diplomna.sports_analytics_backend.service.TeamStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final MatchService matchService;
    private final TeamStatsService teamStatsService;

    @GetMapping
    public List<TeamResponse> getTeams(
            @RequestParam(required = false) String search
    ) {
        return teamService.getTeams(search);
    }

    @GetMapping("/{id}")
    public TeamResponse getTeamById(@PathVariable Long id) {
        return teamService.getTeamById(id);
    }

    @GetMapping("/{id}/recent-matches")
    public List<MatchResponse> getRecentMatchesByTeamId(@PathVariable Long id) {
        return matchService.getRecentMatchesByTeamId(id);
    }

    @GetMapping("/{id}/stats")
    public TeamStatsResponse getTeamStats(@PathVariable Long id) {
        return teamStatsService.getTeamStats(id);
    }
}