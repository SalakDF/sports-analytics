package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.response.MatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.MatchPlayerEventResponse;
import com.diplomna.sports_analytics_backend.entity.MatchStatus;
import com.diplomna.sports_analytics_backend.service.MatchService;
import com.diplomna.sports_analytics_backend.service.MatchPlayerEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final MatchPlayerEventService matchPlayerEventService;

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

    @GetMapping("/{id}/head-to-head")
    public List<MatchResponse> getHeadToHead(@PathVariable Long id) {
        return matchService.getHeadToHeadByMatchId(id);
    }

    @GetMapping("/{id}/player-events")
    public List<MatchPlayerEventResponse> getPlayerEvents(@PathVariable Long id) {
        return matchPlayerEventService.getMatchPlayerEvents(id);
    }
}
