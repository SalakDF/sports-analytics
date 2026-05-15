import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/session";

export default function FavoritesPage() {
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [favoriteMatches, setFavoriteMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();

    if (!user?.id) {
      setError("No logged in user found. Please login first.");
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`http://localhost:8080/api/favorites/teams?userId=${user.id}`).then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch(`http://localhost:8080/api/favorites/matches?userId=${user.id}`).then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
    ])
      .then(([teams, matches]) => {
        setFavoriteTeams(teams);
        setFavoriteMatches(matches);
      })
      .catch(() => setError("Failed to load favorites"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading favorites...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Saved</span>
        <h1 className="page-title">Favorites</h1>
        <p className="page-subtitle">
          Обрані команди та матчі поточного користувача.
        </p>
      </div>

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
                  <span className="badge">Founded: {team.foundedYear || "-"}</span>
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
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}