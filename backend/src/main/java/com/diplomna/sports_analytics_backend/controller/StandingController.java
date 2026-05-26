package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.response.StandingResponse;
import com.diplomna.sports_analytics_backend.service.StandingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/standings")
@RequiredArgsConstructor
public class StandingController {

    private final StandingService standingService;

    @GetMapping
    public List<StandingResponse> getStandings(
            @RequestParam(required = false) Long seasonId
    ) {
        return standingService.getStandings(seasonId);
    }
}