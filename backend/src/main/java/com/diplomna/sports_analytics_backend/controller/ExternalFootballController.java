package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.integration.FootballDataClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/external/football")
@RequiredArgsConstructor
public class ExternalFootballController {

    private final FootballDataClient footballDataClient;

    @GetMapping("/competitions")
    public String getCompetitions() {
        return footballDataClient.getCompetitions();
    }
}