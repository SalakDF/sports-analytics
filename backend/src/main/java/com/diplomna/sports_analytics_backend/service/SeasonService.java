package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.SeasonOptionResponse;
import com.diplomna.sports_analytics_backend.entity.Season;
import com.diplomna.sports_analytics_backend.repository.SeasonRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SeasonService {

    private final SeasonRepository seasonRepository;

    public List<SeasonOptionResponse> getSeasons() {
        return seasonRepository.findAllByOrderByIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public Long getDefaultSeasonId() {
        List<Season> seasons = seasonRepository.findAllByOrderByIdDesc();

        if (seasons.isEmpty()) {
            throw new RuntimeException("No seasons found");
        }

        return seasons.get(0).getId();
    }

    private SeasonOptionResponse toResponse(Season season) {
        return SeasonOptionResponse.builder()
                .id(season.getId())
                .name(season.getName())
                .tournamentName(
                        season.getTournament() != null ? season.getTournament().getName() : null
                )
                .build();
    }
}