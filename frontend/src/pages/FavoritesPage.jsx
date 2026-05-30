import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";

export default function FavoritesPage() {
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [favoriteMatches, setFavoriteMatches] = useState([]);
  const [teamStatsMap, setTeamStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [removingKey, setRemovingKey] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const user = getCurrentUser();

    setLoading(true);
    setStatsLoading(true);
    setError("");
    setActionMessage("");
    setActionError("");

    if (!user?.id) {
      setError("No logged in user found. Please login first.");
      setLoading(false);
      setStatsLoading(false);
      return;
    }

    try {
      const [teams, matches] = await Promise.all([
        fetchJson(`/favorites/teams?userId=${user.id}`),
        fetchJson(`/favorites/matches?userId=${user.id}`),
      ]);

      setFavoriteTeams(teams);
      setFavoriteMatches(matches);

      try {
        const statsEntries = await Promise.all(
          teams.map(async (team) => {
            try {
              const stats = await fetchJson(`/teams/${team.teamId}/stats`);
              return [team.teamId, stats];
            } catch {
              return [team.teamId, null];
            }
          })
        );

        setTeamStatsMap(Object.fromEntries(statsEntries));
      } catch {
        setTeamStatsMap({});
      }
    } catch {
      setError("Failed to load favorites.");
    } finally {
      setLoading(false);
      setStatsLoading(false);
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

    setRemovingKey(`team-${teamId}`);

    try {
      await apiRequest(`/favorites/teams?userId=${user.id}&teamId=${teamId}`, {
        method: "DELETE",
      });

      setFavoriteTeams((prev) => prev.filter((team) => team.teamId !== teamId));
      setTeamStatsMap((prev) => {
        const next = { ...prev };
        delete next[teamId];
        return next;
      });
      setActionMessage("Team removed from favorites.");
    } catch {
      setActionError("Failed to remove team from favorites.");
    } finally {
      setRemovingKey("");
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

    setRemovingKey(`match-${matchId}`);

    try {
      await apiRequest(`/favorites/matches?userId=${user.id}&matchId=${matchId}`, {
        method: "DELETE",
      });

      setFavoriteMatches((prev) => prev.filter((match) => match.matchId !== matchId));
      setActionMessage("Match removed from favorites.");
    } catch {
      setActionError("Failed to remove match from favorites.");
    } finally {
      setRemovingKey("");
    }
  }

  function getStatusClass(status) {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  const analytics = useMemo(() => {
    const stats = Object.values(teamStatsMap).filter(Boolean);

    if (!stats.length) {
      return {
        averageWinRate: 0,
        totalGoals: 0,
        totalMatches: 0,
      };
    }

    const totalWinRate = stats.reduce((sum, item) => sum + (item.winRate || 0), 0);
    const totalGoals = stats.reduce((sum, item) => sum + (item.goalsFor || 0), 0);
    const totalMatches = stats.reduce((sum, item) => sum + (item.matchesPlayed || 0), 0);

    return {
      averageWinRate: Math.round((totalWinRate / stats.length) * 100) / 100,
      totalGoals,
      totalMatches,
    };
  }, [teamStatsMap]);

  const bestFavoriteTeam = useMemo(() => {
    let best = null;

    for (const team of favoriteTeams) {
      const stats = teamStatsMap[team.teamId];
      if (!stats) continue;

      if (!best || (stats.winRate || 0) > (best.stats.winRate || 0)) {
        best = { team, stats };
      }
    }

    return best;
  }, [favoriteTeams, teamStatsMap]);

  if (loading || statsLoading) {
    return <div className="loading-state">Loading favorites...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <span className="page-kicker">Saved</span>
          <h1 className="page-title">Favorites</h1>
          <p className="page-subtitle">
            Обрані команди та матчі доступні після авторизації.
          </p>
        </div>

        <div className="error-state">{error}</div>

        <div style={{ marginTop: "18px" }}>
          <Link to="/auth" className="hero-button hero-button-primary">
            Go to auth
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Saved</span>
        <h1 className="page-title">Favorites</h1>
        <p className="page-subtitle">
          Обрані команди та матчі поточного користувача з короткою аналітикою.
        </p>
      </div>

      <div className="grid grid-4 favorites-analytics-grid" style={{ marginBottom: "22px" }}>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Teams</span>
          </div>
          <div className="standings-summary-value">{favoriteTeams.length}</div>
          <p className="card-muted">Команди у favorites.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Matches</span>
          </div>
          <div className="standings-summary-value">{favoriteMatches.length}</div>
          <p className="card-muted">Матчі у favorites.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Avg win rate</span>
          </div>
          <div className="standings-summary-value">{analytics.averageWinRate}%</div>
          <p className="card-muted">Середній win rate обраних команд.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Goals</span>
          </div>
          <div className="standings-summary-value">{analytics.totalGoals}</div>
          <p className="card-muted">Сумарно забиті голи обраних команд.</p>
        </div>
      </div>

      {bestFavoriteTeam ? (
        <div className="card" style={{ marginBottom: "22px" }}>
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Best Favorite Team
            </h2>
          </div>

          <div className="best-favorite-team">
            <div className="standings-team-wrap">
              <TeamLogo
                name={bestFavoriteTeam.team.name}
                shortName={bestFavoriteTeam.team.shortName}
                size="sm"
              />
              <div>
                <div className="mini-info-title">{bestFavoriteTeam.team.name}</div>
                <div className="mini-info-text">
                  Highest win rate among your favorite teams
                </div>
              </div>
            </div>

            <div className="best-favorite-team-stats">
              <div className="team-stat-chip">
                <span>Win rate</span>
                <strong>{bestFavoriteTeam.stats.winRate}%</strong>
              </div>

              <div className="team-stat-chip">
                <span>Goals</span>
                <strong>{bestFavoriteTeam.stats.goalsFor}</strong>
              </div>

              <div className="team-stat-chip">
                <span>Matches</span>
                <strong>{bestFavoriteTeam.stats.matchesPlayed}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

      <div className="grid grid-2">
        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Favorite Teams
            </h2>
            <span className="results-count" style={{ margin: 0 }}>
              {favoriteTeams.length} saved
            </span>
          </div>

          {!favoriteTeams.length ? (
            <div className="empty-state">No favorite teams yet.</div>
          ) : (
            <div className="grid" style={{ gap: "14px" }}>
              {favoriteTeams.map((team) => {
                const stats = teamStatsMap[team.teamId];

                return (
                  <div className="card team-list-card team-list-card-premium" key={team.favoriteId}>
                    <div className="team-list-ribbon">
                      <span>{team.country || "Club"}</span>
                    </div>

                    <div className="team-inline team-list-card-top">
                      <TeamLogo name={team.name} shortName={team.shortName} />

                      <div className="team-inline-text">
                        <div className="team-inline-name">
                          {team.name}
                          {team.shortName ? ` (${team.shortName})` : ""}
                        </div>
                        <div className="team-inline-subtitle">
                          {team.country || "Country not specified"}
                        </div>
                      </div>
                    </div>

                    {stats ? (
                      <div className="team-analytics-grid" style={{ marginTop: 0 }}>
                        <div className="team-analytics-item">
                          <span>Win rate</span>
                          <strong>{stats.winRate}%</strong>
                        </div>

                        <div className="team-analytics-item">
                          <span>Goals</span>
                          <strong>{stats.goalsFor}</strong>
                        </div>
                      </div>
                    ) : null}

                    <div className="favorites-actions-row">
                      <Link className="action-link" to={`/teams/${team.teamId}`}>
                        Open team →
                      </Link>

                      <button
                        type="button"
                        className="hero-button hero-button-secondary"
                        onClick={() => handleRemoveTeam(team.teamId)}
                        disabled={removingKey === `team-${team.teamId}`}
                      >
                        {removingKey === `team-${team.teamId}` ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Favorite Matches
            </h2>
            <span className="results-count" style={{ margin: 0 }}>
              {favoriteMatches.length} saved
            </span>
          </div>

          {!favoriteMatches.length ? (
            <div className="empty-state">No favorite matches yet.</div>
          ) : (
            <div className="grid" style={{ gap: "14px" }}>
              {favoriteMatches.map((match) => (
                <div
                  className="card match-list-card match-list-card-premium"
                  key={match.favoriteId}
                >
                  <div className="match-list-topline">
                    <div className="match-list-competition">
                      {match.tournamentName || "Tournament -"}
                    </div>
                    <span className={getStatusClass(match.status)}>
                      {match.status}
                    </span>
                  </div>

                  <div className="match-card-header">
                    <div className="match-teams-stack">
                      <div className="team-inline">
                        <TeamLogo name={match.homeTeamName} size="sm" />
                        <div className="team-inline-text">
                          <div className="team-inline-name">{match.homeTeamName}</div>
                          <div className="team-inline-subtitle">Home</div>
                        </div>
                      </div>

                      <div className="team-inline">
                        <TeamLogo name={match.awayTeamName} size="sm" />
                        <div className="team-inline-text">
                          <div className="team-inline-name">{match.awayTeamName}</div>
                          <div className="team-inline-subtitle">Away</div>
                        </div>
                      </div>
                    </div>

                    <div className="match-list-score match-score-panel">
                      <div className="match-list-score-value">
                        {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                      </div>
                    </div>
                  </div>

                  <div className="match-list-meta">
                    <span className="badge">{match.seasonName || "Season -"}</span>
                    <span className="badge">
                      {match.scheduledAt
                        ? new Date(match.scheduledAt).toLocaleDateString()
                        : "No date"}
                    </span>
                  </div>

                  <div className="favorites-actions-row">
                    <Link className="action-link" to={`/matches/${match.matchId}`}>
                      Open match →
                    </Link>

                    <button
                      type="button"
                      className="hero-button hero-button-secondary"
                      onClick={() => handleRemoveMatch(match.matchId)}
                      disabled={removingKey === `match-${match.matchId}`}
                    >
                      {removingKey === `match-${match.matchId}` ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}