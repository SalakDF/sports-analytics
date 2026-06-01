package com.diplomna.sports_analytics_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamNameCleanupResponse {
    private int totalTeams;
    private int updatedTeams;
}
