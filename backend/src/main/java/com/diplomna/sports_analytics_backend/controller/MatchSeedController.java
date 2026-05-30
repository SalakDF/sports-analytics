package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.service.MatchSeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/match-tools")
@RequiredArgsConstructor
public class MatchSeedController {

    private final MatchSeedService matchSeedService;

    @PostMapping("/seed-fixtures")
    public String seedFixtures(@RequestParam Long seasonId) {
        return matchSeedService.seedFixtures(seasonId);
    }
}