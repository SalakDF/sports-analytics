package com.diplomna.sports_analytics_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "external_team_mapping")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalTeamMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long externalTeamId;

    @Column(nullable = false)
    private String externalTeamName;

    @Column(nullable = false)
    private Long internalTeamId;

    @Column(nullable = false)
    private String internalTeamName;

    private LocalDateTime mappedAt;
}