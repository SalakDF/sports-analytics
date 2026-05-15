package com.diplomna.sports_analytics_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "favorite_matches",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "match_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;
}
