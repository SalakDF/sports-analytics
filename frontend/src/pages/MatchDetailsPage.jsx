import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";

export default function MatchDetailsPage() {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteError, setFavoriteError] = useState("");

  useEffect(() => {
    fetchJson(`/matches/${id}`)
      .then((data) => setMatch(data))
      .catch(() => setError("Failed to load match details."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user?.id) {
      setIsFavorite(false);
      return;
    }

    fetchJson(`/favorites/matches?userId=${user.id}`)
      .then((favorites) => {
        const exists = favorites.some(
          (favoriteMatch) => String(favoriteMatch.matchId) === String(id)
        );
        setIsFavorite(exists);
      })
      .catch(() => setIsFavorite(false));
  }, [id]);

  function getStatusClass(status) {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  async function handleFavoriteAction() {
    const user = getCurrentUser();

    setFavoriteMessage("");
    setFavoriteError("");

    if (!user?.id) {
      setFavoriteError("Please login first to manage favorites.");
      return;
    }

    setFavoriteLoading(true);

    try {
      await apiRequest(`/favorites/matches?userId=${user.id}&matchId=${id}`, {
        method: isFavorite ? "DELETE" : "POST",
      });

      if (isFavorite) {
        setIsFavorite(false);
        setFavoriteMessage("Match removed from favorites.");
      } else {
        setIsFavorite(true);
        setFavoriteMessage("Match added to favorites.");
      }
    } catch {
      setFavoriteError("Failed to update favorite match.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  if (loading) return <div className="loading-state">Loading match details...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!match) return <div className="empty-state">Match not found.</div>;

  return (
    <div>
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-top-row">
            <span className="page-kicker">Match Center</span>

            <div className="meta-row">
              <span className={getStatusClass(match.status)}>{match.status}</span>
              <span className="badge">{match.roundName || "Round -"}</span>
              <span className="badge">{match.venue || "Venue -"}</span>
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
              <div className="team-inline-subtitle">Home Team</div>
            </div>

            <div className="match-detail-center">
              <div className="match-detail-score">
                {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
              </div>
              <div className="detail-subtitle" style={{ textAlign: "center" }}>
                {match.scheduledAt
                  ? new Date(match.scheduledAt).toLocaleString()
                  : "Date not available"}
              </div>
            </div>

            <div className="match-detail-team">
              <TeamLogo
                name={match.awayTeamName}
                logoUrl={match.awayTeamLogoUrl}
                size="lg"
              />
              <div className="match-detail-team-name">{match.awayTeamName}</div>
              <div className="team-inline-subtitle">Away Team</div>
            </div>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className={
                isFavorite
                  ? "hero-button hero-button-secondary"
                  : "hero-button hero-button-primary"
              }
              onClick={handleFavoriteAction}
              disabled={favoriteLoading}
            >
              {favoriteLoading
                ? "Please wait..."
                : isFavorite
                ? "Remove from favorites"
                : "Add to favorites"}
            </button>

            <Link to="/matches" className="hero-button hero-button-secondary">
              Back to matches
            </Link>
          </div>

          {favoriteMessage ? (
            <div className="loading-state" style={{ marginTop: "16px" }}>
              {favoriteMessage}
            </div>
          ) : null}

          {favoriteError ? (
            <div className="error-state" style={{ marginTop: "16px" }}>
              {favoriteError}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card detail-card">
          <h2 className="section-title">Match Info</h2>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Tournament</span>
              <span className="detail-info-value">{match.tournamentName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Season</span>
              <span className="detail-info-value">{match.seasonName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Round</span>
              <span className="detail-info-value">{match.roundName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Venue</span>
              <span className="detail-info-value">{match.venue || "-"}</span>
            </div>
          </div>
        </div>

        <div className="card detail-card">
          <h2 className="section-title">Quick Navigation</h2>

          <p className="detail-paragraph">
            Тут пізніше можна буде додати події матчу, розширену статистику,
            форму команд, володіння м’ячем, удари та інші аналітичні блоки.
          </p>

          <div className="detail-links-column">
            <Link className="action-link" to={`/teams/${match.homeTeamId}`}>
              Open home team →
            </Link>
            <Link className="action-link" to={`/teams/${match.awayTeamId}`}>
              Open away team →
            </Link>
            <Link className="action-link" to="/matches">
              ← Back to matches
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}