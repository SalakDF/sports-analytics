package com.diplomna.sports_analytics_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "external_competition_mapping")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalCompetitionMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String externalCompetitionCode;

    @Column(nullable = false)
    private String externalCompetitionName;

    @Column(nullable = false)
    private Long internalSeasonId;

    @Column(nullable = false)
    private String internalSeasonName;

    private LocalDateTime mappedAt;
}