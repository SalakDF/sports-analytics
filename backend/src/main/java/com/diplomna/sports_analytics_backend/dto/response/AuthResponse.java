package com.diplomna.sports_analytics_backend.dto.response;

import com.diplomna.sports_analytics_backend.entity.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private Long id;
    private String email;
    private Role role;
}