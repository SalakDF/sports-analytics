package com.diplomna.sports_analytics_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "external_match_sync")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalMatchSync {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long externalMatchId;

    @Column(nullable = false)
    private Long internalMatchId;

    @Column(nullable = false)
    private String competitionCode;

    private LocalDateTime syncedAt;
}