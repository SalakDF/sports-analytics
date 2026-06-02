import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";
import { useTimezone } from "../context/TimezoneContext";
import { useLanguage } from "../context/LanguageContext";
import {
  formatDateTimeFromMs,
  parseMatchTimestamp,
} from "../utils/datetime";

export default function MatchDetailsPage() {
  const { id } = useParams();
  const { timezone } = useTimezone();
  const { t } = useLanguage();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [homeRecentMatches, setHomeRecentMatches] = useState([]);
  const [awayRecentMatches, setAwayRecentMatches] = useState([]);
  const [headToHeadMatches, setHeadToHeadMatches] = useState([]);
  const [homeStats, setHomeStats] = useState(null);
  const [awayStats, setAwayStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [headToHeadLoading, setHeadToHeadLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchJson(`/matches/${id}`)
      .then(setMatch)
      .catch(() =>
        setError(
          t("matchDetails.errorLoad", "Failed to load match details.")
        )
      )
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    fetchJson(`/matches/${id}/player-events`)
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!match?.homeTeamId || !match?.awayTeamId) return;

    setRecentLoading(true);
    setHeadToHeadLoading(true);
    setStatsLoading(true);

    Promise.all([
      fetchJson(`/teams/${match.homeTeamId}/recent-matches`).catch(() => []),
      fetchJson(`/teams/${match.awayTeamId}/recent-matches`).catch(() => []),
      fetchJson(`/matches/${id}/head-to-head`).catch(() => []),
      fetchJson(`/teams/${match.homeTeamId}/stats`).catch(() => null),
      fetchJson(`/teams/${match.awayTeamId}/stats`).catch(() => null),
    ]).then(
      ([homeRecent, awayRecent, headToHead, homeStatsData, awayStatsData]) => {
        setHomeRecentMatches(Array.isArray(homeRecent) ? homeRecent : []);
        setAwayRecentMatches(Array.isArray(awayRecent) ? awayRecent : []);
        setHeadToHeadMatches(Array.isArray(headToHead) ? headToHead : []);
        setHomeStats(homeStatsData);
        setAwayStats(awayStatsData);
        setRecentLoading(false);
        setHeadToHeadLoading(false);
        setStatsLoading(false);
      }
    );
  }, [id, match?.homeTeamId, match?.awayTeamId]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) return;
    fetchJson(`/favorites/matches?userId=${user.id}`)
      .then((favorites) =>
        setIsFavorite(
          favorites.some((item) => String(item.matchId) === String(id))
        )
      )
      .catch(() => setIsFavorite(false));
  }, [id]);

  async function toggleFavorite() {
    const user = getCurrentUser();
    if (!user?.id) return;
    await apiRequest(`/favorites/matches?userId=${user.id}&matchId=${id}`, {
      method: isFavorite ? "DELETE" : "POST",
    });
    setIsFavorite((value) => !value);
  }

  function buildRecentForm(items, teamId) {
    return items.slice(0, 5).map((item) => {
      const isHomeTeam = String(item.homeTeamId) === String(teamId);
      const teamScore = isHomeTeam ? item.homeScore : item.awayScore;
      const opponentScore = isHomeTeam ? item.awayScore : item.homeScore;

      let result = "D";
      if ((teamScore ?? -1) > (opponentScore ?? -1)) result = "W";
      if ((teamScore ?? -1) < (opponentScore ?? -1)) result = "L";

      return {
        ...item,
        result,
        opponentName: isHomeTeam ? item.awayTeamName : item.homeTeamName,
      };
    });
  }

  const homeForm = useMemo(
    () => buildRecentForm(homeRecentMatches, match?.homeTeamId),
    [homeRecentMatches, match?.homeTeamId]
  );

  const awayForm = useMemo(
    () => buildRecentForm(awayRecentMatches, match?.awayTeamId),
    [awayRecentMatches, match?.awayTeamId]
  );

  const eventRows = useMemo(() => events.slice(0, 14), [events]);

  const headToHeadSummary = useMemo(() => {
    if (!match) return { homeWins: 0, awayWins: 0, draws: 0 };

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    for (const item of headToHeadMatches) {
      const currentHomeIsHome = String(item.homeTeamId) === String(match.homeTeamId);
      const currentHomeScore = currentHomeIsHome ? item.homeScore : item.awayScore;
      const currentAwayScore = currentHomeIsHome ? item.awayScore : item.homeScore;

      if ((currentHomeScore ?? -1) > (currentAwayScore ?? -1)) homeWins += 1;
      else if ((currentHomeScore ?? -1) < (currentAwayScore ?? -1)) awayWins += 1;
      else draws += 1;
    }

    return { homeWins, awayWins, draws };
  }, [headToHeadMatches, match]);

  const insightText = useMemo(() => {
    if (!homeStats || !awayStats || !match) {
      return t(
        "matchDetails.insightUnavailable",
        "Comparison insight is not available yet."
      );
    }

    const homePower =
      (homeStats.winRate || 0) +
      (homeStats.averageGoalsFor || 0) * 10 +
      (homeStats.goalDifference || 0);

    const awayPower =
      (awayStats.winRate || 0) +
      (awayStats.averageGoalsFor || 0) * 10 +
      (awayStats.goalDifference || 0);

    const diff = homePower - awayPower;

    if (Math.abs(diff) < 5) {
      return t(
        "matchDetails.insightBalanced",
        "The matchup looks balanced based on current team stats."
      );
    }

    return diff > 0
      ? t(
          "matchDetails.insightHomeEdge",
          "The home team has a slight statistical edge."
        )
      : t(
          "matchDetails.insightAwayEdge",
          "The away team has a slight statistical edge."
        );
  }, [awayStats, homeStats, match, t]);

  function renderMiniMatch(item) {
    return (
      <div
        key={item.id}
        className="mini-info-card"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <div className="mini-info-title">
          {item.homeTeamName} vs {item.awayTeamName}
        </div>
        <div className="mini-info-text">
          {item.homeScore ?? "-"} : {item.awayScore ?? "-"} •{" "}
          {item.tournamentName || "-"}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        {t("matchDetails.loading", "Loading match details...")}
      </div>
    );
  }
  if (error) return <div className="error-state">{error}</div>;
  if (!match) {
    return (
      <div className="empty-state">
        {t("matchDetails.notFound", "Match not found.")}
      </div>
    );
  }

  return (
    <div>
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-top-row">
            <span className="page-kicker">
              {t("matchDetails.kicker", "Match Center")}
            </span>
            <div className="meta-row">
              <span className="badge">{match.status}</span>
              <span className="badge">
                {match.tournamentName || t("matchDetails.tournament", "Tournament")}
              </span>
              <span className="badge">
                {t("common.venue", "Venue")}: {match.venue || "-"}
              </span>
            </div>
          </div>

          <div className="match-detail-scoreboard">
            <div className="match-detail-team">
              <TeamLogo
                name={match.homeTeamName}
                logoUrl={match.homeTeamLogoUrl}
                size="lg"
              />
              <div className="match-detail-team-name">{match.homeTeamName}</div>
              <div className="team-inline-subtitle">
                {t("common.home", "Home")}
              </div>
            </div>

            <div className="match-detail-center">
              <div className="match-detail-score">
                {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
              </div>
              <div className="detail-subtitle">
                {formatDateTimeFromMs(parseMatchTimestamp(match), timezone)}
              </div>
            </div>

            <div className="match-detail-team">
              <TeamLogo
                name={match.awayTeamName}
                logoUrl={match.awayTeamLogoUrl}
                size="lg"
              />
              <div className="match-detail-team-name">{match.awayTeamName}</div>
              <div className="team-inline-subtitle">
                {t("common.away", "Away")}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="hero-button hero-button-secondary"
              onClick={toggleFavorite}
            >
              {isFavorite
                ? t("matchDetails.removeFav", "Remove from favorites")
                : t("matchDetails.addFav", "Add to favorites")}
            </button>
            <Link to="/matches" className="hero-button hero-button-secondary">
              {t("matchDetails.back", "Back to matches")}
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card detail-card">
          <h2 className="section-title">
            {t("matchDetails.info", "Match info")}
          </h2>
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">
                {t("matchDetails.tournament", "Tournament")}
              </span>
              <span className="detail-info-value">{match.tournamentName || "-"}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">
                {t("common.season", "Season")}
              </span>
              <span className="detail-info-value">{match.seasonName || "-"}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">
                {t("common.round", "Round")}
              </span>
              <span className="detail-info-value">{match.roundName || "-"}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">
                {t("common.venue", "Venue")}
              </span>
              <span className="detail-info-value">{match.venue || "-"}</span>
            </div>
          </div>
        </div>

        <div className="card detail-card">
          <h2 className="section-title">
            {t("matchDetails.quickView", "Quick view")}
          </h2>
          <p className="detail-paragraph">{insightText}</p>
          <div className="detail-links-column">
            <Link className="action-link" to={`/teams/${match.homeTeamId}`}>
              {t("matchDetails.openHomeTeam", "Open home team")} {"->"}
            </Link>
            <Link className="action-link" to={`/teams/${match.awayTeamId}`}>
              {t("matchDetails.openAwayTeam", "Open away team")} {"->"}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: "22px" }}>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{match.homeTeamName}</span>
          </div>
          <div className="standings-summary-value">{headToHeadSummary.homeWins}</div>
          <p className="card-muted">
            {t("matchDetails.h2hHomeWins", "Wins in recent head-to-head matches.")}
          </p>
        </div>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{t("matchDetails.draws", "Draws")}</span>
          </div>
          <div className="standings-summary-value">{headToHeadSummary.draws}</div>
          <p className="card-muted">
            {t("matchDetails.h2hDraws", "Draw results in recent meetings.")}
          </p>
        </div>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{match.awayTeamName}</span>
          </div>
          <div className="standings-summary-value">{headToHeadSummary.awayWins}</div>
          <p className="card-muted">
            {t("matchDetails.h2hAwayWins", "Wins in recent head-to-head matches.")}
          </p>
        </div>
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">
          {t("matchDetails.comparison", "Team comparison")}
        </h2>
        {statsLoading ? (
          <div className="loading-state">
            {t("matchDetails.comparisonLoading", "Loading comparison stats...")}
          </div>
        ) : !homeStats || !awayStats ? (
          <div className="empty-state">
            {t("matchDetails.comparisonEmpty", "Comparison stats are not available.")}
          </div>
        ) : (
          <div className="comparison-grid">
            <div className="comparison-stat-card">
              <span className="detail-info-label">
                {t("teams.winRate", "Win rate")}
              </span>
              <div className="comparison-line">
                <strong>{homeStats.winRate}%</strong>
                <span>vs</span>
                <strong>{awayStats.winRate}%</strong>
              </div>
            </div>
            <div className="comparison-stat-card">
              <span className="detail-info-label">
                {t("matchDetails.avgGoals", "Avg goals scored")}
              </span>
              <div className="comparison-line">
                <strong>{homeStats.averageGoalsFor}</strong>
                <span>vs</span>
                <strong>{awayStats.averageGoalsFor}</strong>
              </div>
            </div>
            <div className="comparison-stat-card">
              <span className="detail-info-label">{t("teams.gd", "GD")}</span>
              <div className="comparison-line">
                <strong>{homeStats.goalDifference}</strong>
                <span>vs</span>
                <strong>{awayStats.goalDifference}</strong>
              </div>
            </div>
            <div className="comparison-stat-card">
              <span className="detail-info-label">
                {t("teams.cleanSheets", "Clean sheets")}
              </span>
              <div className="comparison-line">
                <strong>{homeStats.cleanSheets}</strong>
                <span>vs</span>
                <strong>{awayStats.cleanSheets}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">
          {t("matchDetails.headToHead", "Head-to-head")}
        </h2>
        {headToHeadLoading ? (
          <div className="loading-state">
            {t("matchDetails.h2hLoading", "Loading head-to-head...")}
          </div>
        ) : !headToHeadMatches.length ? (
          <div className="empty-state">
            {t("matchDetails.h2hEmpty", "No previous meetings found.")}
          </div>
        ) : (
          <div className="grid" style={{ gap: "12px" }}>
            {headToHeadMatches.map(renderMiniMatch)}
          </div>
        )}
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card detail-card">
          <h2 className="section-title">
            {t("matchDetails.homeForm", "Home team form")}
          </h2>
          {recentLoading ? (
            <div className="loading-state">
              {t("matchDetails.formLoading", "Loading recent form...")}
            </div>
          ) : !homeForm.length ? (
            <div className="empty-state">
              {t("matchDetails.formEmpty", "No recent matches found.")}
            </div>
          ) : (
            <>
              <div className="form-badges-row">
                {homeForm.map((item) => (
                  <span
                    key={item.id}
                    className={`form-badge form-badge-${item.result.toLowerCase()}`}
                    title={`${item.result} vs ${item.opponentName}`}
                  >
                    {item.result}
                  </span>
                ))}
              </div>
              <div className="grid" style={{ gap: "12px", marginTop: "16px" }}>
                {homeForm.map(renderMiniMatch)}
              </div>
            </>
          )}
        </div>

        <div className="card detail-card">
          <h2 className="section-title">
            {t("matchDetails.awayForm", "Away team form")}
          </h2>
          {recentLoading ? (
            <div className="loading-state">
              {t("matchDetails.formLoading", "Loading recent form...")}
            </div>
          ) : !awayForm.length ? (
            <div className="empty-state">
              {t("matchDetails.formEmpty", "No recent matches found.")}
            </div>
          ) : (
            <>
              <div className="form-badges-row">
                {awayForm.map((item) => (
                  <span
                    key={item.id}
                    className={`form-badge form-badge-${item.result.toLowerCase()}`}
                    title={`${item.result} vs ${item.opponentName}`}
                  >
                    {item.result}
                  </span>
                ))}
              </div>
              <div className="grid" style={{ gap: "12px", marginTop: "16px" }}>
                {awayForm.map(renderMiniMatch)}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">
          {t("matchDetails.events", "Key player events")}
        </h2>
        {eventsLoading ? (
          <div className="loading-state">
            {t("matchDetails.eventsLoading", "Loading player events...")}
          </div>
        ) : !eventRows.length ? (
          <div className="empty-state">
            {t(
              "matchDetails.eventsEmpty",
              "No player events available for this match."
            )}
          </div>
        ) : (
          <div className="events-list">
            {eventRows.map((event, index) => (
              <div
                key={`${event.minute || "na"}-${event.playerName || "p"}-${index}`}
                className="event-row"
              >
                <div className="event-row-top">
                  <span className="event-chip event-chip-default">
                    {event.type || t("matchDetails.event", "EVENT")}
                  </span>
                  <span className="event-minute">
                    {event.minute ? `${event.minute}'` : "-"}
                  </span>
                </div>
                <div className="event-primary">
                  {event.playerName ||
                    t("matchDetails.unknownPlayer", "Unknown player")}
                </div>
                <div className="event-secondary">
                  {event.teamName || t("matchDetails.team", "Team")}
                  {event.assistName
                    ? ` • ${t("matchDetails.assist", "Assist")}: ${event.assistName}`
                    : ""}
                  {event.detail ? ` • ${event.detail}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
