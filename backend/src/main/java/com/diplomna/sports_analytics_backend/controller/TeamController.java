package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.response.TeamResponse;
import com.diplomna.sports_analytics_backend.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

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
}