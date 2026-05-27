package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.request.ExternalCompetitionMappingRequest;
import com.diplomna.sports_analytics_backend.dto.response.ExternalCompetitionMappingResponse;
import com.diplomna.sports_analytics_backend.service.ExternalCompetitionMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/external/football/competition-mappings")
@RequiredArgsConstructor
public class ExternalCompetitionMappingController {

    private final ExternalCompetitionMappingService externalCompetitionMappingService;

    @GetMapping
    public List<ExternalCompetitionMappingResponse> getMappings() {
        return externalCompetitionMappingService.getMappings();
    }

    @PostMapping
    public ExternalCompetitionMappingResponse saveMapping(
            @RequestBody ExternalCompetitionMappingRequest request
    ) {
        return externalCompetitionMappingService.saveMapping(request);
    }
}