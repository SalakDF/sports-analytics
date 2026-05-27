package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.request.ExternalTeamMappingRequest;
import com.diplomna.sports_analytics_backend.dto.response.ExternalTeamAutoMapResultResponse;
import com.diplomna.sports_analytics_backend.dto.response.ExternalTeamMappingResponse;
import com.diplomna.sports_analytics_backend.service.ExternalTeamMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/external/football/team-mappings")
@RequiredArgsConstructor
public class ExternalTeamMappingController {

    private final ExternalTeamMappingService externalTeamMappingService;

    @GetMapping
    public List<ExternalTeamMappingResponse> getMappings() {
        return externalTeamMappingService.getMappings();
    }

    @PostMapping
    public ExternalTeamMappingResponse saveMapping(
            @RequestBody ExternalTeamMappingRequest request
    ) {
        return externalTeamMappingService.saveMapping(request);
    }

    @PostMapping("/auto")
    public ExternalTeamAutoMapResultResponse autoMapTeams(
            @RequestParam String competitionCode
    ) {
        return externalTeamMappingService.autoMapTeamsByCompetition(competitionCode);
    }

    @DeleteMapping("/{externalTeamId}")
    public void deleteMapping(@PathVariable Long externalTeamId) {
        externalTeamMappingService.deleteMappingByExternalTeamId(externalTeamId);
    }
}