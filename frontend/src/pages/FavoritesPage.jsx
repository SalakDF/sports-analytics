import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";
import { useLanguage } from "../context/LanguageContext";

export default function FavoritesPage() {
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [favoriteMatches, setFavoriteMatches] = useState([]);
  const [teamStatsMap, setTeamStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [removingKey, setRemovingKey] = useState("");
  const { t } = useLanguage();

  useEffect(() => { loadFavorites(); }, []);

  async function loadFavorites() {
    const user = getCurrentUser();
    setLoading(true);
    setError("");
    setActionError("");

    if (!user?.id) {
      setError(t("favorites.noUser", "No logged in user found. Please login first."));
      setLoading(false);
      return;
    }

    try {
      const [teams, matches] = await Promise.all([
        fetchJson(`/favorites/teams?userId=${user.id}`),
        fetchJson(`/favorites/matches?userId=${user.id}`),
      ]);
      setFavoriteTeams(teams);
      setFavoriteMatches(matches);

      const statsEntries = await Promise.all(
        teams.map(async (team) => {
          try { return [team.teamId, await fetchJson(`/teams/${team.teamId}/stats`)]; }
          catch { return [team.teamId, null]; }
        })
      );
      setTeamStatsMap(Object.fromEntries(statsEntries));
    } catch {
      setError(t("favorites.errorLoad", "Failed to load favorites."));
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveTeam(teamId) {
    const user = getCurrentUser();
    if (!user?.id) return setActionError(t("favorites.loginFirst", "Please login first."));
    setRemovingKey(`team-${teamId}`);
    setActionError("");
    try {
      await apiRequest(`/favorites/teams?userId=${user.id}&teamId=${teamId}`, { method: "DELETE" });
      setFavoriteTeams((prev) => prev.filter((team) => team.teamId !== teamId));
    } catch {
      setActionError(t("favorites.errorRemoveTeam", "Failed to remove team from favorites."));
    } finally {
      setRemovingKey("");
    }
  }

  async function handleRemoveMatch(matchId) {
    const user = getCurrentUser();
    if (!user?.id) return setActionError(t("favorites.loginFirst", "Please login first."));
    setRemovingKey(`match-${matchId}`);
    setActionError("");
    try {
      await apiRequest(`/favorites/matches?userId=${user.id}&matchId=${matchId}`, { method: "DELETE" });
      setFavoriteMatches((prev) => prev.filter((match) => match.matchId !== matchId));
    } catch {
      setActionError(t("favorites.errorRemoveMatch", "Failed to remove match from favorites."));
    } finally {
      setRemovingKey("");
    }
  }

  const avgWinRate = useMemo(() => {
    const stats = Object.values(teamStatsMap).filter(Boolean);
    if (!stats.length) return 0;
    return Math.round((stats.reduce((s, i) => s + (i.winRate || 0), 0) / stats.length) * 100) / 100;
  }, [teamStatsMap]);

  if (loading) return <div className="loading-state">{t("favorites.loading", "Loading favorites...")}</div>;

  if (error) {
    return (
      <div>
        <div className="page-header"><span className="page-kicker">{t("header.favorites", "Favorites")}</span><h1 className="page-title">{t("header.favorites", "Favorites")}</h1></div>
        <div className="error-state">{error}</div>
        <div style={{ marginTop: "18px" }}><Link to="/auth" className="hero-button hero-button-primary">{t("favorites.goAuth", "Go to auth")}</Link></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">{t("header.favorites", "Favorites")}</span>
        <h1 className="page-title">{t("header.favorites", "Favorites")}</h1>
      </div>

      {actionError ? <div className="error-state" style={{ marginBottom: "18px" }}>{actionError}</div> : null}

      <div className="grid grid-4 favorites-analytics-grid" style={{ marginBottom: "22px" }}>
        <div className="card stat-card"><div className="stat-card-top"><span className="page-kicker">{t("header.teams", "Teams")}</span></div><div className="standings-summary-value">{favoriteTeams.length}</div></div>
        <div className="card stat-card"><div className="stat-card-top"><span className="page-kicker">{t("header.matches", "Matches")}</span></div><div className="standings-summary-value">{favoriteMatches.length}</div></div>
        <div className="card stat-card"><div className="stat-card-top"><span className="page-kicker">{t("teams.winRate", "Win rate")}</span></div><div className="standings-summary-value">{avgWinRate}%</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-header-row"><h2 className="section-title" style={{ margin: 0 }}>{t("favorites.favoriteTeams", "Favorite Teams")}</h2></div>
          {!favoriteTeams.length ? <div className="empty-state">{t("favorites.noTeams", "No favorite teams yet.")}</div> : (
            <div className="grid" style={{ gap: "14px" }}>
              {favoriteTeams.map((team) => (
                <div className="card team-list-card team-list-card-premium" key={team.favoriteId}>
                  <div className="team-inline team-list-card-top">
                    <TeamLogo name={team.name} shortName={team.shortName} />
                    <div className="team-inline-text"><div className="team-inline-name">{team.name}{team.shortName ? ` (${team.shortName})` : ""}</div></div>
                  </div>
                  <div className="favorites-actions-row">
                    <Link className="action-link" to={`/teams/${team.teamId}`}>{t("teams.openTeam", "Open team")} →</Link>
                    <button type="button" className="hero-button hero-button-secondary" onClick={() => handleRemoveTeam(team.teamId)} disabled={removingKey === `team-${team.teamId}`}>{removingKey === `team-${team.teamId}` ? t("favorites.removing", "Removing...") : t("favorites.remove", "Remove")}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header-row"><h2 className="section-title" style={{ margin: 0 }}>{t("favorites.favoriteMatches", "Favorite Matches")}</h2></div>
          {!favoriteMatches.length ? <div className="empty-state">{t("favorites.noMatches", "No favorite matches yet.")}</div> : (
            <div className="grid" style={{ gap: "14px" }}>
              {favoriteMatches.map((match) => (
                <div className="card match-list-card match-list-card-premium" key={match.favoriteId}>
                  <div className="match-list-topline"><div className="match-list-competition">{match.tournamentName || "Tournament -"}</div></div>
                  <div className="match-card-header">
                    <div className="match-teams-stack">
                      <div className="team-inline"><TeamLogo name={match.homeTeamName} size="sm" /><div className="team-inline-text"><div className="team-inline-name">{match.homeTeamName}</div></div></div>
                      <div className="team-inline"><TeamLogo name={match.awayTeamName} size="sm" /><div className="team-inline-text"><div className="team-inline-name">{match.awayTeamName}</div></div></div>
                    </div>
                    <div className="match-list-score match-score-panel"><div className="match-list-score-value">{match.homeScore ?? "-"} : {match.awayScore ?? "-"}</div></div>
                  </div>
                  <div className="favorites-actions-row">
                    <Link className="action-link" to={`/matches/${match.matchId}`}>{t("matches.openMatch", "Open match")} →</Link>
                    <button type="button" className="hero-button hero-button-secondary" onClick={() => handleRemoveMatch(match.matchId)} disabled={removingKey === `match-${match.matchId}`}>{removingKey === `match-${match.matchId}` ? t("favorites.removing", "Removing...") : t("favorites.remove", "Remove")}</button>
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
