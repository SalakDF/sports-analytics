export function parseMatchTimestamp(match) {
  if (!match?.scheduledAt) return null;

  if (match.venue === "External API" && !String(match.scheduledAt).endsWith("Z")) {
    return new Date(`${match.scheduledAt}Z`).getTime();
  }

  return new Date(match.scheduledAt).getTime();
}

function buildLocaleOptions(timezone, extra = {}) {
  if (timezone === "LOCAL") return extra;
  return { ...extra, timeZone: timezone };
}

export function formatDateTimeFromMs(ms, timezone) {
  if (!ms) return "Date not available";
  return new Date(ms).toLocaleString(undefined, buildLocaleOptions(timezone));
}

export function formatDateFromMs(ms, timezone) {
  if (!ms) return "No date";
  return new Date(ms).toLocaleDateString(undefined, buildLocaleOptions(timezone));
}

export function formatTimeZoneLabel(timezone) {
  if (timezone === "LOCAL") {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `Local (${tz || "System"})`;
  }
  return timezone;
}

