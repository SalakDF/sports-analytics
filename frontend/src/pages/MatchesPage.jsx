import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson, apiRequest } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";
import FavoriteButton from "../components/common/FavoriteButton";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [search, setSearch] = useState("");
  const [competitionFilter, setCompetitionFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadMatches();
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadFavoriteMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);
    setError("");

    try {
      const query = search.trim()
        ? `/matches?search=${encodeURIComponent(search.trim())}`
        : "/matches";

      const data = await fetchJson(query);
      setMatches(data);
    } catch {
      setError("Failed to load matches.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFavoriteMatches() {
    if (!currentUser?.id) {
      setFavoritesLoading(false);
      return;
    }

    try {
      const data = await fetchJson(`/favorites/matches?userId=${currentUser.id}`);
      setFavoriteIds(data.map((item) => item.matchId));
    } catch {
      setFavoriteIds([]);
    } finally {
      setFavoritesLoading(false);
    }
  }

  async function handleToggleFavorite(matchId) {
    if (!currentUser?.id) {
      setActionError("Please login first to use favorites.");
      return;
    }

    setTogglingId(matchId);
    setActionError("");

    try {
      const isFavorite = favoriteIds.includes(matchId);

      await apiRequest(`/favorites/matches?userId=${currentUser.id}&matchId=${matchId}`, {
        method: isFavorite ? "DELETE" : "POST",
      });

      setFavoriteIds((prev) =>
        isFavorite ? prev.filter((id) => id !== matchId) : [...prev, matchId]
      );
    } catch {
      setActionError("Failed to update favorite match.");
    } finally {
      setTogglingId(null);
    }
  }

  function getStatusClass(status) {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  function normalizeSection(status) {
    if (status === "LIVE") return "LIVE";
    if (status === "FINISHED") return "FINISHED";
    return "UPCOMING";
  }

  function sortMatches(items) {
    const sorted = [...items];

    sorted.sort((a, b) => {
      if (sortBy === "date-asc") {
        return new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0);
      }

      if (sortBy === "date-desc") {
        return new Date(b.scheduledAt || 0) - new Date(a.scheduledAt || 0);
      }

      if (sortBy === "teams-az") {
        const aName = `${a.homeTeamName} ${a.awayTeamName}`.toLowerCase();
        const bName = `${b.homeTeamName} ${b.awayTeamName}`.toLowerCase();
        return aName.localeCompare(bName);
      }

      if (sortBy === "score-desc") {
        const aScore = (a.homeScore ?? 0) + (a.awayScore ?? 0);
        const bScore = (b.homeScore ?? 0) + (b.awayScore ?? 0);
        return bScore - aScore;
      }

      return 0;
    });

    return sorted;
  }

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const competitionOptions = useMemo(() => {
    const names = matches
      .map((match) => match.tournamentName)
      .filter(Boolean);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [matches]);

  const groupedMatches = useMemo(() => {
    const live = [];
    const finished = [];
    const upcoming = [];

    matches.forEach((match) => {
      if (
        competitionFilter !== "ALL" &&
        match.tournamentName !== competitionFilter
      ) {
        return;
      }

      const section = normalizeSection(match.status);

      if (section === "LIVE") live.push(match);
      else if (section === "FINISHED") finished.push(match);
      else upcoming.push(match);
    });

    return {
      LIVE: sortMatches(live),
      FINISHED: sortMatches(finished),
      UPCOMING: sortMatches(upcoming),
    };
  }, [matches, sortBy, competitionFilter]);

  const sectionsToRender =
    sectionFilter === "ALL"
      ? ["LIVE", "UPCOMING", "FINISHED"]
      : [sectionFilter];

  const totalFilteredCount =
    (groupedMatches.LIVE?.length || 0) +
    (groupedMatches.UPCOMING?.length || 0) +
    (groupedMatches.FINISHED?.length || 0);

  function renderMatchCard(match) {
    return (
      <div
        className={`card match-list-card match-list-card-premium ${
          viewMode === "list" ? "match-list-card-list" : ""
        }`}
        key={match.id}
      >
        <div className="match-list-card-actions">
          <div className="match-list-topline">
            <div className="match-list-competition">
              {match.tournamentName || "Tournament -"}
            </div>
            <span className={getStatusClass(match.status)}>{match.status}</span>
          </div>

          <FavoriteButton
            active={favoriteSet.has(match.id)}
            loading={togglingId === match.id}
            onClick={() => handleToggleFavorite(match.id)}
            title={
              favoriteSet.has(match.id)
                ? "Remove from favorites"
                : "Add to favorites"
            }
          />
        </div>

        <div className="match-card-header">
          <div className="match-teams-stack">
            <div className="team-inline">
              <TeamLogo
                name={match.homeTeamName}
                logoUrl={match.homeTeamLogoUrl}
                size="sm"
              />
              <div className="team-inline-text">
                <div className="team-inline-name">{match.homeTeamName}</div>
                <div className="team-inline-subtitle">Home</div>
              </div>
            </div>

            <div className="team-inline">
              <TeamLogo
                name={match.awayTeamName}
                logoUrl={match.awayTeamLogoUrl}
                size="sm"
              />
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
            <div className="team-inline-subtitle">
              {match.scheduledAt
                ? new Date(match.scheduledAt).toLocaleDateString()
                : "No date"}
            </div>
          </div>
        </div>

        <div className="match-list-meta">
          <span className="badge">{match.seasonName || "Season -"}</span>
          <span className="badge">{match.roundName || "Round -"}</span>
          <span className="badge">Venue: {match.venue || "-"}</span>
        </div>

        <p className="card-muted" style={{ marginTop: "14px" }}>
          {match.scheduledAt
            ? new Date(match.scheduledAt).toLocaleString()
            : "Date not available"}
        </p>

        <Link className="action-link" to={`/matches/${match.id}`}>
          Open match →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Fixtures</span>
        <h1 className="page-title">Matches</h1>
        <p className="page-subtitle">
          Матчі поділені на live, upcoming і finished, з табами ліг,
          сортуванням і вибором режиму перегляду.
        </p>
      </div>

      <div className="league-tabs-wrap">
        <button
          type="button"
          className={`league-tab ${competitionFilter === "ALL" ? "league-tab-active" : ""}`}
          onClick={() => setCompetitionFilter("ALL")}
        >
          All
        </button>

        {competitionOptions.map((competition) => (
          <button
            key={competition}
            type="button"
            className={`league-tab ${
              competitionFilter === competition ? "league-tab-active" : ""
            }`}
            onClick={() => setCompetitionFilter(competition)}
          >
            {competition}
          </button>
        ))}
      </div>

      <div className="grid grid-4 matches-summary-grid" style={{ marginBottom: "22px" }}>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">All</span>
          </div>
          <div className="standings-summary-value">{totalFilteredCount}</div>
          <p className="card-muted">Усі матчі після фільтрації.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Live</span>
          </div>
          <div className="standings-summary-value">{groupedMatches.LIVE.length}</div>
          <p className="card-muted">Матчі, що тривають зараз.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Upcoming</span>
          </div>
          <div className="standings-summary-value">{groupedMatches.UPCOMING.length}</div>
          <p className="card-muted">Заплановані матчі.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Finished</span>
          </div>
          <div className="standings-summary-value">{groupedMatches.FINISHED.length}</div>
          <p className="card-muted">Завершені матчі.</p>
        </div>
      </div>

      <div className="matches-toolbar matches-toolbar-compact">
        <input
          type="text"
          className="search-input"
          placeholder="Search by team or tournament..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="filter-select"
          value={sectionFilter}
          onChange={(event) => setSectionFilter(event.target.value)}
        >
          <option value="ALL">All sections</option>
          <option value="LIVE">Live only</option>
          <option value="UPCOMING">Upcoming only</option>
          <option value="FINISHED">Finished only</option>
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="teams-az">Teams A-Z</option>
          <option value="score-desc">Highest score</option>
        </select>

        <div className="view-switcher">
          <button
            type="button"
            className={viewMode === "grid" ? "view-switch-active" : ""}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className={viewMode === "list" ? "view-switch-active" : ""}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </div>

      {actionError ? (
        <div className="error-state" style={{ marginBottom: "18px" }}>
          {actionError}
        </div>
      ) : null}

      {loading || favoritesLoading ? (
        <div className="loading-state">Loading matches...</div>
      ) : null}

      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !favoritesLoading && !error ? (
        <div className="matches-sections">
          {sectionsToRender.map((sectionKey) => {
            const sectionMatches = groupedMatches[sectionKey] || [];

            return (
              <section className="matches-status-block" key={sectionKey}>
                <div className="section-header-row">
                  <h2 className="section-title" style={{ margin: 0 }}>
                    {sectionKey === "LIVE"
                      ? "Live Matches"
                      : sectionKey === "UPCOMING"
                      ? "Upcoming Matches"
                      : "Finished Matches"}
                  </h2>

                  <span className="results-count" style={{ margin: 0 }}>
                    {sectionMatches.length}
                  </span>
                </div>

                {!sectionMatches.length ? (
                  <div className="empty-state">No matches in this section.</div>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-2" : "grid"}>
                    {sectionMatches.map(renderMatchCard)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}