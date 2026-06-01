package com.diplomna.sports_analytics_backend.service;

import com.diplomna.sports_analytics_backend.dto.response.MatchPlayerEventResponse;
import com.diplomna.sports_analytics_backend.integration.ApiFootballClient;
import com.diplomna.sports_analytics_backend.repository.ExternalMatchSyncRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchPlayerEventService {

    private final ExternalMatchSyncRepository externalMatchSyncRepository;
    private final ApiFootballClient apiFootballClient;
    private final ObjectMapper objectMapper;

    public List<MatchPlayerEventResponse> getMatchPlayerEvents(Long internalMatchId) {
        var sync = externalMatchSyncRepository.findByInternalMatchId(internalMatchId).orElse(null);
        if (sync == null) {
            return List.of();
        }

        try {
            String json = apiFootballClient.getFixtureEvents(sync.getExternalMatchId());
            JsonNode response = objectMapper.readTree(json).path("response");
            if (!response.isArray()) {
                return List.of();
            }

            List<MatchPlayerEventResponse> result = new ArrayList<>();
            for (JsonNode eventNode : response) {
                String type = eventNode.path("type").asText("");
                if (!isKeyEventType(type)) {
                    continue;
                }

                result.add(MatchPlayerEventResponse.builder()
                        .teamName(eventNode.path("team").path("name").asText(null))
                        .playerName(eventNode.path("player").path("name").asText(null))
                        .assistName(eventNode.path("assist").path("name").asText(null))
                        .type(type)
                        .detail(eventNode.path("detail").asText(null))
                        .minute(eventNode.path("time").path("elapsed").isNumber()
                                ? eventNode.path("time").path("elapsed").asInt()
                                : null)
                        .build());
            }

            result.sort(Comparator.comparing(
                    item -> item.getMinute() == null ? Integer.MAX_VALUE : item.getMinute()
            ));
            return result;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private boolean isKeyEventType(String type) {
        return "Goal".equalsIgnoreCase(type)
                || "Card".equalsIgnoreCase(type)
                || "subst".equalsIgnoreCase(type);
    }
}
