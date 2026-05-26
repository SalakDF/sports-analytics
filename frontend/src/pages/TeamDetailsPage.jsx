import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";

export default function TeamDetailsPage() {
  const { id } = useParams();

  const [team, setTeam] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteError, setFavoriteError] = useState("");

  useEffect(() => {
    fetchJson(`/teams/${id}`)
      .then((data) => setTeam(data))
      .catch(() => setError("Failed to load team details"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchJson(`/teams/${id}/recent-matches`)
      .then((data) => setRecentMatches(data))
      .catch(() => setRecentMatches([]))
      .finally(() => setRecentLoading(false));
  }, [id]);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user?.id) {
      setIsFavorite(false);
      return;
    }

    fetchJson(`/favorites/teams?userId=${user.id}`)
      .then((favorites) => {
        const exists = favorites.some(
          (favoriteTeam) => String(favoriteTeam.teamId) === String(id)
        );
        setIsFavorite(exists);
      })
      .catch(() => {
        setIsFavorite(false);
      });
  }, [id]);

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
      await apiRequest(`/favorites/teams?userId=${user.id}&teamId=${id}`, {
        method: isFavorite ? "DELETE" : "POST",
      });

      if (isFavorite) {
        setIsFavorite(false);
        setFavoriteMessage("Team removed from favorites.");
      } else {
        setIsFavorite(true);
        setFavoriteMessage("Team added to favorites.");
      }
    } catch {
      setFavoriteError("Failed to update favorite team.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  const recentForm = useMemo(() => {
    return recentMatches.map((match) => {
      const isHome = String(match.homeTeamId) === String(id);
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      let result = "D";
      if (teamScore > opponentScore) result = "W";
      if (teamScore < opponentScore) result = "L";

      return {
        ...match,
        result,
        opponentName: isHome ? match.awayTeamName : match.homeTeamName,
      };
    });
  }, [recentMatches, id]);

  if (loading) return <div className="loading-state">Loading team details...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!team) return <div className="empty-state">Team not found.</div>;

  return (
    <div>
      <div className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-top">
            <span className="page-kicker">Club Profile</span>
            <div className="meta-row" style={{ marginTop: 0 }}>
              <span className="badge">
                {team.country ? `Country: ${team.country}` : "Country: -"}
              </span>
              <span className="badge">
                Founded: {team.foundedYear || "-"}
              </span>
              <span className="badge">
                {team.shortName ? `Code: ${team.shortName}` : "Code: -"}
              </span>
            </div>
          </div>

          <div className="detail-hero-brand">
            <TeamLogo
              name={team.name}
              shortName={team.shortName}
              logoUrl={team.logoUrl}
              size="lg"
            />

            <div className="detail-hero-brand-text">
              <h1 className="detail-title">{team.name}</h1>
              <p className="detail-subtitle">
                Детальна сторінка команди з основною інформацією, коротким
                описом, recent form та можливістю додати клуб до favorites.
              </p>
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

            <Link to="/teams" className="hero-button hero-button-secondary">
              Back to teams
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
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card detail-card">
          <h2 className="section-title">Overview</h2>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Full name</span>
              <span className="detail-info-value">{team.name || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Short name</span>
              <span className="detail-info-value">{team.shortName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Country</span>
              <span className="detail-info-value">{team.country || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Founded</span>
              <span className="detail-info-value">{team.foundedYear || "-"}</span>
            </div>
          </div>
        </div>

        <div className="card detail-card">
          <h2 className="section-title">Description</h2>

          <p className="detail-paragraph">
            {team.description || "No description available for this team yet."}
          </p>
        </div>
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">Recent Form</h2>

        {recentLoading ? (
          <div className="loading-state">Loading recent form...</div>
        ) : !recentForm.length ? (
          <div className="empty-state">No recent finished matches found.</div>
        ) : (
          <>
            <div className="form-badges-row">
              {recentForm.map((item) => (
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
              {recentForm.map((match) => (
                <div
                  key={match.id}
                  className="mini-info-card"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="mini-info-title">
                    {match.homeTeamName} vs {match.awayTeamName}
                  </div>
                  <div className="mini-info-text">
                    Score: {match.homeScore ?? "-"} : {match.awayScore ?? "-"} •{" "}
                    {match.tournamentName}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}