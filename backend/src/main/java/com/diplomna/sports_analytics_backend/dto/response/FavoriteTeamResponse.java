package com.diplomna.sports_analytics_backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FavoriteTeamResponse {
    private Long favoriteId;
    private Long teamId;
    private String name;
    private String shortName;
    private String country;
    private Integer foundedYear;
}