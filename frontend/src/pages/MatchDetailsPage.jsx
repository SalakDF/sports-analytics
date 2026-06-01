import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";
import { useTimezone } from "../context/TimezoneContext";
import { useLanguage } from "../context/LanguageContext";
import { formatDateTimeFromMs, parseMatchTimestamp } from "../utils/datetime";

export default function MatchDetailsPage() {
  const { id } = useParams();
  const { timezone } = useTimezone();
  const { t } = useLanguage();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchJson(`/matches/${id}`)
      .then(setMatch)
      .catch(() => setError(t("matchDetails.errorLoad", "Failed to load match details.")))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    fetchJson(`/matches/${id}/player-events`)
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, [id]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) return;
    fetchJson(`/favorites/matches?userId=${user.id}`)
      .then((f) => setIsFavorite(f.some((x) => String(x.matchId) === String(id))))
      .catch(() => setIsFavorite(false));
  }, [id]);

  async function toggleFavorite() {
    const user = getCurrentUser();
    if (!user?.id) return;
    await apiRequest(`/favorites/matches?userId=${user.id}&matchId=${id}`, {
      method: isFavorite ? "DELETE" : "POST",
    });
    setIsFavorite((v) => !v);
  }

  const eventRows = useMemo(() => events.slice(0, 14), [events]);
  if (loading) return <div className="loading-state">{t("matchDetails.loading", "Loading match details...")}</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!match) return <div className="empty-state">{t("matchDetails.notFound", "Match not found.")}</div>;

  return (
    <div>
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-top-row">
            <span className="page-kicker">{t("matchDetails.kicker", "Match Center")}</span>
            <div className="meta-row">
              <span className="badge">{match.status}</span>
              <span className="badge">{match.roundName || `${t("common.round", "Round")} -`}</span>
              <span className="badge">{t("common.venue", "Venue")}: {match.venue || "-"}</span>
            </div>
          </div>

          <div className="match-detail-scoreboard">
            <div className="match-detail-team">
              <TeamLogo name={match.homeTeamName} logoUrl={match.homeTeamLogoUrl} size="lg" />
              <div className="match-detail-team-name">{match.homeTeamName}</div>
            </div>
            <div className="match-detail-center">
              <div className="match-detail-score">{match.homeScore ?? "-"} : {match.awayScore ?? "-"}</div>
              <div className="detail-subtitle">{formatDateTimeFromMs(parseMatchTimestamp(match), timezone)}</div>
            </div>
            <div className="match-detail-team">
              <TeamLogo name={match.awayTeamName} logoUrl={match.awayTeamLogoUrl} size="lg" />
              <div className="match-detail-team-name">{match.awayTeamName}</div>
            </div>
          </div>

          <div className="detail-actions">
            <button type="button" className="hero-button hero-button-secondary" onClick={toggleFavorite}>
              {isFavorite ? t("matchDetails.removeFav", "Remove from favorites") : t("matchDetails.addFav", "Add to favorites")}
            </button>
            <Link to="/matches" className="hero-button hero-button-secondary">{t("matchDetails.back", "Back to matches")}</Link>
          </div>
        </div>
      </section>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">{t("matchDetails.events", "Key player events")}</h2>
        {eventsLoading ? (
          <div className="loading-state">{t("matchDetails.eventsLoading", "Loading player events...")}</div>
        ) : !eventRows.length ? (
          <div className="empty-state">{t("matchDetails.eventsEmpty", "No player events available for this match.")}</div>
        ) : (
          <div className="events-list">
            {eventRows.map((e, i) => (
              <div key={`${e.minute || "na"}-${e.playerName || "p"}-${i}`} className="event-row">
                <div className="event-row-top">
                  <span className="event-chip event-chip-default">{e.type || t("matchDetails.event", "EVENT")}</span>
                  <span className="event-minute">{e.minute ? `${e.minute}'` : "-"}</span>
                </div>
                <div className="event-primary">{e.playerName || t("matchDetails.unknownPlayer", "Unknown player")}</div>
                <div className="event-secondary">
                  {e.teamName || t("matchDetails.team", "Team")}
                  {e.assistName ? ` • ${t("matchDetails.assist", "Assist")}: ${e.assistName}` : ""}
                  {e.detail ? ` • ${e.detail}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
