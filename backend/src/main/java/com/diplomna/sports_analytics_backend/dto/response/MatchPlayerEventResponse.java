package com.diplomna.sports_analytics_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchPlayerEventResponse {
    private String teamName;
    private String playerName;
    private String assistName;
    private String type;
    private String detail;
    private Integer minute;
}
