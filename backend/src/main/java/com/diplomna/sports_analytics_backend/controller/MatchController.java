package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.response.MatchResponse;
import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import com.diplomna.sports_analytics_backend.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping
    public List<MatchResponse> getMatches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) MatchStatus status
    ) {
        return matchService.getMatches(search, status);
    }

    @GetMapping("/{id}")
    public MatchResponse getMatchById(@PathVariable Long id) {
        return matchService.getMatchById(id);
    }
}