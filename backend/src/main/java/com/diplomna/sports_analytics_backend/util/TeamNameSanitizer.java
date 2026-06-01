package com.diplomna.sports_analytics_backend.util;

import java.util.Locale;
import java.util.regex.Pattern;

public final class TeamNameSanitizer {

    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");
    private static final Pattern LEADING_NUMERIC_PREFIX = Pattern.compile("^(?:\\d+\\.?\\s+)+");
    private static final Pattern LEADING_PUNCT = Pattern.compile("^[\\p{Punct}\\s]+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9 ]");

    private TeamNameSanitizer() {}

    public static String sanitizeDisplayName(String raw) {
        if (raw == null) {
            return null;
        }

        String value = MULTI_SPACE.matcher(raw.trim()).replaceAll(" ");
        value = LEADING_NUMERIC_PREFIX.matcher(value).replaceAll("");
        value = LEADING_PUNCT.matcher(value).replaceAll("").trim();
        value = MULTI_SPACE.matcher(value).replaceAll(" ");

        return value.isBlank() ? raw.trim() : value;
    }

    public static String buildShortName(String raw) {
        String cleaned = sanitizeDisplayName(raw);
        if (cleaned == null || cleaned.isBlank()) {
            return null;
        }

        String value = cleaned
                .replace("Football Club", " ")
                .replace("Soccer Club", " ")
                .replace(" FC ", " ")
                .replace(" AFC ", " ")
                .replace(" CF ", " ")
                .replace(" SC ", " ")
                .replace(" AC ", " ")
                .trim();

        value = MULTI_SPACE.matcher(value).replaceAll(" ");
        if (value.isBlank()) {
            value = cleaned;
        }

        if (value.length() > 12) {
            value = value.substring(0, 12).trim();
        }

        return LEADING_PUNCT.matcher(value).replaceAll("").trim();
    }

    public static String normalizeName(String value) {
        if (value == null) {
            return "";
        }

        String normalized = sanitizeDisplayName(value).toLowerCase(Locale.ROOT).trim();

        normalized = normalized
                .replace("football club", " ")
                .replace("soccer club", " ")
                .replace(" fc ", " ")
                .replace(" afc ", " ")
                .replace(" cf ", " ")
                .replace(" sc ", " ")
                .replace(" ac ", " ")
                .replace(" club ", " ");

        normalized = NON_ALNUM.matcher(normalized).replaceAll(" ");
        normalized = MULTI_SPACE.matcher(normalized).replaceAll(" ").trim();
        return normalized;
    }
}
