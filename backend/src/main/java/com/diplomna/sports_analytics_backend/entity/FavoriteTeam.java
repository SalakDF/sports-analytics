package com.diplomna.sports_analytics_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "favorite_teams",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "team_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
}