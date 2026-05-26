package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.TeamResponse;
import com.diplomna.sports_analytics_backend.entity.Team;
import com.diplomna.sports_analytics_backend.repository.TeamRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamService {

    private final TeamRepository teamRepository;

    public List<TeamResponse> getTeams(String search) {
        List<Team> teams;

        if (search == null || search.isBlank()) {
            teams = teamRepository.findAllByOrderByNameAsc();
        } else {
            String value = search.trim();
            teams = teamRepository
                    .findByNameContainingIgnoreCaseOrShortNameContainingIgnoreCaseOrCountryContainingIgnoreCaseOrderByNameAsc(
                            value,
                            value,
                            value
                    );
        }

        return teams.stream()
                .map(this::toResponse)
                .toList();
    }

    public TeamResponse getTeamById(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));

        return toResponse(team);
    }

    private TeamResponse toResponse(Team team) {
        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .shortName(team.getShortName())
                .country(team.getCountry())
                .logoUrl(team.getLogoUrl())
                .description(team.getDescription())
                .foundedYear(team.getFoundedYear())
                .build();
    }
}