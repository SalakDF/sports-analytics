package com.diplomna.sports_analytics_backend.controller;

import com.diplomna.sports_analytics_backend.dto.response.FavoriteMatchResponse;
import com.diplomna.sports_analytics_backend.dto.response.FavoriteTeamResponse;
import com.diplomna.sports_analytics_backend.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/teams")
    public FavoriteTeamResponse addFavoriteTeam(
            @RequestParam Long userId,
            @RequestParam Long teamId
    ) {
        return favoriteService.addFavoriteTeam(userId, teamId);
    }

    @GetMapping("/teams")
    public List<FavoriteTeamResponse> getFavoriteTeams(@RequestParam Long userId) {
        return favoriteService.getFavoriteTeams(userId);
    }

    @DeleteMapping("/teams")
    public void removeFavoriteTeam(
            @RequestParam Long userId,
            @RequestParam Long teamId
    ) {
        favoriteService.removeFavoriteTeam(userId, teamId);
    }

    @PostMapping("/matches")
    public FavoriteMatchResponse addFavoriteMatch(
            @RequestParam Long userId,
            @RequestParam Long matchId
    ) {
        return favoriteService.addFavoriteMatch(userId, matchId);
    }

    @GetMapping("/matches")
    public List<FavoriteMatchResponse> getFavoriteMatches(@RequestParam Long userId) {
        return favoriteService.getFavoriteMatches(userId);
    }

    @DeleteMapping("/matches")
    public void removeFavoriteMatch(
            @RequestParam Long userId,
            @RequestParam Long matchId
    ) {
        favoriteService.removeFavoriteMatch(userId, matchId);
    }
}