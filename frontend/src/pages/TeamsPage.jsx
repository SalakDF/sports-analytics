import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";
import FavoriteButton from "../components/common/FavoriteButton";
import { useLanguage } from "../context/LanguageContext";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [leagueTeamIds, setLeagueTeamIds] = useState([]);
  const [teamStatsMap, setTeamStatsMap] = useState({});
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-az");
  const [loading, setLoading] = useState(true);
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const { t } = useLanguage();

  const currentUser = getCurrentUser();

  useEffect(() => {
    const timeout = setTimeout(() => loadTeamsAndSeasons(), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadFavoriteTeams();
  }, []);

  useEffect(() => {
    loadLeagueTeams();
  }, [selectedCompetition, seasons]);

  async function loadTeamsAndSeasons() {
    setLoading(true);
    setStatsLoading(true);
    setError("");

    try {
      const teamsQuery = search.trim()
        ? `/teams?search=${encodeURIComponent(search.trim())}`
        : "/teams";

      const [teamsData, seasonsData] = await Promise.all([fetchJson(teamsQuery), fetchJson("/seasons")]);
      setTeams(teamsData);
      setSeasons(seasonsData);

      const statsResults = await Promise.all(
        teamsData.map(async (team) => {
          try {
            const stats = await fetchJson(`/teams/${team.id}/stats`);
            return [team.id, stats];
          } catch {
            return [team.id, null];
          }
        })
      );

      setTeamStatsMap(Object.fromEntries(statsResults));
    } catch {
      setError(t("teams.errorLoad", "Failed to load teams."));
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }

  async function loadLeagueTeams() {
    if (selectedCompetition === "ALL") {
      setLeagueTeamIds([]);
      return;
    }

    const filteredSeasons = seasons.filter((season) => season.tournamentName === selectedCompetition);
    if (!filteredSeasons.length) {
      setLeagueTeamIds([]);
      return;
    }

    setLeagueLoading(true);
    try {
      const rows = await fetchJson(`/standings?seasonId=${filteredSeasons[0].id}`);
      setLeagueTeamIds(rows.map((row) => row.teamId));
    } catch {
      setLeagueTeamIds([]);
    } finally {
      setLeagueLoading(false);
    }
  }

  async function loadFavoriteTeams() {
    if (!currentUser?.id) {
      setFavoritesLoading(false);
      return;
    }

    try {
      const data = await fetchJson(`/favorites/teams?userId=${currentUser.id}`);
      setFavoriteIds(data.map((item) => item.teamId));
    } catch {
      setFavoriteIds([]);
    } finally {
      setFavoritesLoading(false);
    }
  }

  async function handleToggleFavorite(teamId) {
    if (!currentUser?.id) {
      setActionError(t("teams.errorLogin", "Please login first to use favorites."));
      return;
    }

    setTogglingId(teamId);
    setActionError("");

    try {
      const isFavorite = favoriteIds.includes(teamId);
      await apiRequest(`/favorites/teams?userId=${currentUser.id}&teamId=${teamId}`, {
        method: isFavorite ? "DELETE" : "POST",
      });

      setFavoriteIds((prev) => (isFavorite ? prev.filter((id) => id !== teamId) : [...prev, teamId]));
    } catch {
      setActionError(t("teams.errorFavorite", "Failed to update favorite team."));
    } finally {
      setTogglingId(null);
    }
  }

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const competitionOptions = useMemo(() => {
    const names = seasons.map((season) => season.tournamentName).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [seasons]);

  const filteredTeams = useMemo(() => {
    if (selectedCompetition === "ALL") return teams;
    const idSet = new Set(leagueTeamIds);
    return teams.filter((team) => idSet.has(team.id));
  }, [teams, selectedCompetition, leagueTeamIds]);

  const sortedTeams = useMemo(() => {
    const items = [...filteredTeams].filter((team) => {
      const stats = teamStatsMap[team.id];
      return stats && (stats.matchesPlayed ?? 0) > 0;
    });

    items.sort((a, b) => {
      const aStats = teamStatsMap[a.id];
      const bStats = teamStatsMap[b.id];

      if (sortBy === "name-az") return a.name.localeCompare(b.name);
      if (sortBy === "winrate-desc") return (bStats?.winRate ?? -1) - (aStats?.winRate ?? -1);
      if (sortBy === "goals-desc") return (bStats?.goalsFor ?? -1) - (aStats?.goalsFor ?? -1);
      if (sortBy === "gd-desc") return (bStats?.goalDifference ?? -9999) - (aStats?.goalDifference ?? -9999);
      return 0;
    });

    return items;
  }, [filteredTeams, teamStatsMap, sortBy]);

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">{t("teams.kicker", "Clubs")}</span>
        <h1 className="page-title">{t("teams.title", "Teams")}</h1>
      </div>

      <div className="league-tabs-wrap">
        <button
          type="button"
          className={`league-tab ${selectedCompetition === "ALL" ? "league-tab-active" : ""}`}
          onClick={() => setSelectedCompetition("ALL")}
        >
          {t("common.all", "All")}
        </button>

        {competitionOptions.map((competition) => (
          <button
            key={competition}
            type="button"
            className={`league-tab ${selectedCompetition === competition ? "league-tab-active" : ""}`}
            onClick={() => setSelectedCompetition(competition)}
          >
            {competition}
          </button>
        ))}
      </div>

      <div className="teams-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder={t("teams.searchPlaceholder", "Search by team name, short name or country...")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select className="filter-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="name-az">{t("teams.sortName", "Name A-Z")}</option>
          <option value="winrate-desc">{t("teams.sortWinRate", "Best win rate")}</option>
          <option value="goals-desc">{t("teams.sortGoals", "Most goals scored")}</option>
          <option value="gd-desc">{t("teams.sortGd", "Best goal difference")}</option>
        </select>
      </div>

      {actionError ? <div className="error-state" style={{ marginBottom: "18px" }}>{actionError}</div> : null}
      {loading || favoritesLoading || statsLoading || leagueLoading ? (
        <div className="loading-state">{t("teams.loading", "Loading teams...")}</div>
      ) : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !favoritesLoading && !statsLoading && !leagueLoading && !error ? (
        <>
          <p className="results-count">{t("teams.found", "Found teams")}: {sortedTeams.length}</p>

          {!sortedTeams.length ? (
            <div className="empty-state">{t("teams.noTeams", "No teams found.")}</div>
          ) : (
            <div className="grid grid-2">
              {sortedTeams.map((team) => {
                const stats = teamStatsMap[team.id];
                return (
                  <div className="card team-list-card team-list-card-premium" key={team.id}>
                    <div className="team-list-card-actions">
                      <div className="team-list-ribbon">
                        <span>{team.country || t("teams.club", "Club")}</span>
                      </div>

                      <FavoriteButton
                        active={favoriteSet.has(team.id)}
                        loading={togglingId === team.id}
                        onClick={() => handleToggleFavorite(team.id)}
                        title={favoriteSet.has(team.id) ? "Remove from favorites" : "Add to favorites"}
                      />
                    </div>

                    <div className="team-inline team-list-card-top">
                      <TeamLogo name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} />
                      <div className="team-inline-text">
                        <div className="team-inline-name">{team.name}{team.shortName ? ` (${team.shortName})` : ""}</div>
                        <div className="team-inline-subtitle">{team.country || t("teams.countryMissing", "Country not specified")}</div>
                      </div>
                    </div>

                    <div className="team-stats-strip">
                      <div className="team-stat-chip">
                        <span>{t("teams.cleanSheets", "Clean sheets")}</span>
                        <strong>{stats ? stats.cleanSheets : "-"}</strong>
                      </div>
                      <div className="team-stat-chip">
                        <span>{t("teams.avgGoals", "Avg goals")}</span>
                        <strong>{stats ? stats.averageGoalsFor : "-"}</strong>
                      </div>
                    </div>

                    {stats ? (
                      <div className="team-analytics-grid">
                        <div className="team-analytics-item"><span>{t("teams.played", "Played")}</span><strong>{stats.matchesPlayed}</strong></div>
                        <div className="team-analytics-item"><span>{t("teams.winRate", "Win rate")}</span><strong>{stats.winRate}%</strong></div>
                        <div className="team-analytics-item"><span>{t("teams.goals", "Goals")}</span><strong>{stats.goalsFor}</strong></div>
                        <div className="team-analytics-item"><span>{t("teams.gd", "GD")}</span><strong>{stats.goalDifference}</strong></div>
                      </div>
                    ) : (
                      <div className="empty-state" style={{ marginTop: "12px" }}>{t("teams.noStats", "No stats available yet.")}</div>
                    )}

                    <p className="card-muted team-description-preview">{team.description || t("teams.noDescription", "No description available.")}</p>
                    <Link className="action-link" to={`/teams/${team.id}`}>{t("teams.openTeam", "Open team")} →</Link>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
