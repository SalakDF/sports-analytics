package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TeamResponse {
    private Long id;
    private String name;
    private String shortName;
    private String country;
    private String logoUrl;
    private String description;
    private Integer foundedYear;
}
