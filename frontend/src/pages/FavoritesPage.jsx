import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../utils/session";

export default function FavoritesPage() {
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [favoriteMatches, setFavoriteMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const user = getCurrentUser();

    setLoading(true);
    setError("");
    setActionMessage("");
    setActionError("");

    if (!user?.id) {
      setError("No logged in user found. Please login first.");
      setLoading(false);
      return;
    }

    try {
      const [teamsResponse, matchesResponse] = await Promise.all([
        fetch(`http://localhost:8080/api/favorites/teams?userId=${user.id}`),
        fetch(`http://localhost:8080/api/favorites/matches?userId=${user.id}`),
      ]);

      if (!teamsResponse.ok || !matchesResponse.ok) {
        throw new Error();
      }

      const teams = await teamsResponse.json();
      const matches = await matchesResponse.json();

      setFavoriteTeams(teams);
      setFavoriteMatches(matches);
    } catch {
      setError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveTeam(teamId) {
    const user = getCurrentUser();

    setActionMessage("");
    setActionError("");

    if (!user?.id) {
      setActionError("Please login first.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/favorites/teams?userId=${user.id}&teamId=${teamId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setFavoriteTeams((prev) => prev.filter((team) => team.teamId !== teamId));
      setActionMessage("Team removed from favorites.");
    } catch {
      setActionError("Failed to remove team from favorites.");
    }
  }

  async function handleRemoveMatch(matchId) {
    const user = getCurrentUser();

    setActionMessage("");
    setActionError("");

    if (!user?.id) {
      setActionError("Please login first.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/favorites/matches?userId=${user.id}&matchId=${matchId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setFavoriteMatches((prev) =>
        prev.filter((match) => match.matchId !== matchId)
      );
      setActionMessage("Match removed from favorites.");
    } catch {
      setActionError("Failed to remove match from favorites.");
    }
  }

  if (loading) return <div className="loading-state">Loading favorites...</div>;
  if (error)
    return (
      <div>
        <div className="page-header">
          <span className="page-kicker">Saved</span>
          <h1 className="page-title">Favorites</h1>
        </div>

        <div className="error-state">{error}</div>

        <div style={{ marginTop: "18px" }}>
          <Link to="/auth" className="hero-button hero-button-primary">
            Go to auth
          </Link>
        </div>
      </div>
    );

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Saved</span>
        <h1 className="page-title">Favorites</h1>
        <p className="page-subtitle">
          Обрані команди та матчі поточного користувача.
        </p>
      </div>

      <div className="favorites-summary">
        <div className="mini-stat-card">
          <div className="mini-stat-value">{favoriteTeams.length}</div>
          <div className="mini-stat-label">Teams</div>
        </div>

        <div className="mini-stat-card">
          <div className="mini-stat-value">{favoriteMatches.length}</div>
          <div className="mini-stat-label">Matches</div>
        </div>
      </div>

      {actionMessage ? (
        <div className="loading-state" style={{ marginBottom: "18px" }}>
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="error-state" style={{ marginBottom: "18px" }}>
          {actionError}
        </div>
      ) : null}

      <section style={{ marginBottom: "28px" }}>
        <h2 className="section-title">Favorite Teams</h2>

        {!favoriteTeams.length ? (
          <div className="empty-state">No favorite teams yet.</div>
        ) : (
          <div className="grid grid-2">
            {favoriteTeams.map((team) => (
              <div className="card" key={team.favoriteId}>
                <h3 className="card-title">
                  {team.name}
                  {team.shortName ? ` (${team.shortName})` : ""}
                </h3>

                <div className="meta-row">
                  <span className="badge">{team.country || "Country -"}</span>
                  <span className="badge">
                    Founded: {team.foundedYear || "-"}
                  </span>
                </div>

                <div className="meta-row" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="hero-button hero-button-secondary"
                    onClick={() => handleRemoveTeam(team.teamId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">Favorite Matches</h2>

        {!favoriteMatches.length ? (
          <div className="empty-state">No favorite matches yet.</div>
        ) : (
          <div className="grid grid-2">
            {favoriteMatches.map((match) => (
              <div className="card" key={match.favoriteId}>
                <h3 className="card-title">
                  {match.homeTeamName} vs {match.awayTeamName}
                </h3>

                <div className="meta-row">
                  <span className="badge">{match.status}</span>
                  <span className="badge">
                    Score: {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                  </span>
                </div>

                <p className="card-muted" style={{ marginTop: "14px" }}>
                  {match.tournamentName} • {match.seasonName}
                </p>

                <div className="meta-row" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="hero-button hero-button-secondary"
                    onClick={() => handleRemoveMatch(match.matchId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}