package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.response.ExternalMatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalStandingsResponse;
import com.diplomna.sports_analytics_backend.dto.response.ImportResultResponse;
import com.diplomna.sports_analytics_backend.integration.FootballDataClient;
import com.diplomna.sports_analytics_backend.service.ExternalFootballService;
import com.diplomna.sports_analytics_backend.service.ExternalImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/external/football")
@RequiredArgsConstructor
public class ExternalFootballController {

    private final FootballDataClient footballDataClient;
    private final ExternalFootballService externalFootballService;
    private final ExternalImportService externalImportService;

    @GetMapping("/competitions")
    public String getCompetitions() {
        return footballDataClient.getCompetitions();
    }

    @GetMapping("/competitions/{code}/matches")
    public String getCompetitionMatchesRaw(@PathVariable String code) {
        return footballDataClient.getCompetitionMatches(code);
    }

    @GetMapping("/competitions/{code}/matches/simple")
    public List<ExternalMatchResponse> getCompetitionMatchesSimple(@PathVariable String code) {
        return externalFootballService.getCompetitionMatches(code);
    }

    @GetMapping("/competitions/{code}/standings/simple")
    public ExternalStandingsResponse getCompetitionStandingsSimple(@PathVariable String code) {
        return externalFootballService.getCompetitionStandings(code);
    }

    @GetMapping("/teams/{teamId}/matches/simple")
    public List<ExternalMatchResponse> getTeamMatchesSimple(@PathVariable Long teamId) {
        return externalFootballService.getTeamMatches(teamId);
    }

    @PostMapping("/competitions/{code}/import")
    public ImportResultResponse importCompetitionMatches(@PathVariable String code) {
        return externalImportService.importCompetitionMatches(code);
    }

    @GetMapping("/imported-matches")
    public List<ExternalMatchResponse> getImportedMatches(
            @RequestParam(required = false) String competitionCode
    ) {
        return externalImportService.getImportedMatches(competitionCode);
    }
}