import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson, apiRequest } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";
import FavoriteButton from "../components/common/FavoriteButton";
import { useTimezone } from "../context/TimezoneContext";
import { useLanguage } from "../context/LanguageContext";
import { formatDateFromMs, formatDateTimeFromMs, parseMatchTimestamp } from "../utils/datetime";

const LIVE_REFRESH_MS = 45_000;
const PAGE_SIZE = 20;

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
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { timezone } = useTimezone();
  const { t } = useLanguage();
  const loadMoreRef = useRef(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    const timeout = setTimeout(() => loadMatches(false), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const timer = setInterval(() => loadMatches(true), LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [search]);

  useEffect(() => {
    loadFavoriteMatches();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, competitionFilter, sectionFilter, sortBy, viewMode]);

  async function loadMatches(silent = false) {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const query = search.trim()
        ? `/matches?search=${encodeURIComponent(search.trim())}`
        : "/matches";

      const data = await fetchJson(query);
      setMatches(data);
      setLastUpdatedAt(Date.now());
    } catch {
      if (!silent) {
        setError(t("matches.errorLoad", "Failed to load matches."));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
      setActionError(t("matches.errorLogin", "Please login first to use favorites."));
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
      setActionError(t("matches.errorFavorite", "Failed to update favorite match."));
    } finally {
      setTogglingId(null);
    }
  }

  function getStatusClass(status) {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  function getDisplayStatus(match) {
    if (!match) return "SCHEDULED";
    if (match.status === "FINISHED") return "FINISHED";

    const scheduledAtMs = parseMatchTimestamp(match);
    if (!scheduledAtMs) return match.status || "SCHEDULED";

    const nowMs = Date.now();
    const hoursFromKickoff = (nowMs - scheduledAtMs) / (1000 * 60 * 60);

    if (match.status === "LIVE") {
      if (hoursFromKickoff > 4) return "FINISHED";
      return "LIVE";
    }

    if (match.status === "SCHEDULED" && hoursFromKickoff >= 0 && hoursFromKickoff <= 3) {
      return "LIVE";
    }

    if (match.status === "SCHEDULED" && hoursFromKickoff > 3) {
      return "FINISHED";
    }

    return match.status || "SCHEDULED";
  }

  function normalizeSection(match) {
    const displayStatus = getDisplayStatus(match);
    if (displayStatus === "LIVE") return "LIVE";
    if (displayStatus === "FINISHED") return "FINISHED";

    const scheduledAtMs = parseMatchTimestamp(match);
    if (displayStatus === "SCHEDULED" && scheduledAtMs && scheduledAtMs < Date.now()) {
      return "FINISHED";
    }

    return "UPCOMING";
  }

  function sortMatches(items) {
    const sorted = [...items];

    sorted.sort((a, b) => {
      if (sortBy === "date-asc") {
        return (parseMatchTimestamp(a) || 0) - (parseMatchTimestamp(b) || 0);
      }

      if (sortBy === "date-desc") {
        return (parseMatchTimestamp(b) || 0) - (parseMatchTimestamp(a) || 0);
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
    const names = matches.map((match) => match.tournamentName).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [matches]);

  const groupedMatches = useMemo(() => {
    const live = [];
    const finished = [];
    const upcoming = [];

    matches.forEach((match) => {
      if (competitionFilter !== "ALL" && match.tournamentName !== competitionFilter) {
        return;
      }

      const section = normalizeSection(match);
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
    sectionFilter === "ALL" ? ["LIVE", "UPCOMING", "FINISHED"] : [sectionFilter];

  const totalFilteredCount =
    (groupedMatches.LIVE?.length || 0) +
    (groupedMatches.UPCOMING?.length || 0) +
    (groupedMatches.FINISHED?.length || 0);

  const hasMore = useMemo(
    () => sectionsToRender.some((key) => (groupedMatches[key] || []).length > visibleCount),
    [sectionsToRender, groupedMatches, visibleCount]
  );

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: "220px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  function renderMatchCard(match) {
    const displayStatus = getDisplayStatus(match);
    const hasScore = match.homeScore != null && match.awayScore != null;
    const scoreText = hasScore ? `${match.homeScore} : ${match.awayScore}` : "- : -";

    return (
      <div
        className={`card match-list-card match-list-card-premium ${
          viewMode === "list" ? "match-list-card-list" : ""
        }`}
        key={match.id}
      >
        <div className="match-list-card-actions">
          <div className="match-list-topline">
            <div className="match-list-competition">{match.tournamentName || "Tournament -"}</div>
            <span className={getStatusClass(displayStatus)}>{displayStatus}</span>
          </div>

          <FavoriteButton
            active={favoriteSet.has(match.id)}
            loading={togglingId === match.id}
            onClick={() => handleToggleFavorite(match.id)}
            title={favoriteSet.has(match.id) ? "Remove from favorites" : "Add to favorites"}
          />
        </div>

        <div className="match-card-header">
          <div className="match-teams-stack">
            <div className="team-inline">
              <TeamLogo name={match.homeTeamName} logoUrl={match.homeTeamLogoUrl} size="sm" />
              <div className="team-inline-text">
                <div className="team-inline-name">{match.homeTeamName}</div>
                <div className="team-inline-subtitle">{t("common.home", "Home")}</div>
              </div>
            </div>

            <div className="team-inline">
              <TeamLogo name={match.awayTeamName} logoUrl={match.awayTeamLogoUrl} size="sm" />
              <div className="team-inline-text">
                <div className="team-inline-name">{match.awayTeamName}</div>
                <div className="team-inline-subtitle">{t("common.away", "Away")}</div>
              </div>
            </div>
          </div>

          <div className="match-list-score match-score-panel">
            <div className="match-list-score-value">{scoreText}</div>
            <div className="team-inline-subtitle">
              {hasScore || displayStatus !== "FINISHED"
                ? formatDateFromMs(parseMatchTimestamp(match), timezone)
                : t("matches.scorePending", "Score pending sync")}
            </div>
          </div>
        </div>

        <div className="match-list-meta">
          <span className="badge">{match.seasonName || `${t("common.season", "Season")} -`}</span>
          <span className="badge">{match.roundName || `${t("common.round", "Round")} -`}</span>
          <span className="badge">{t("common.venue", "Venue")}: {match.venue || "-"}</span>
        </div>

        <p className="card-muted" style={{ marginTop: "14px" }}>
          {formatDateTimeFromMs(parseMatchTimestamp(match), timezone)}
        </p>

        <Link className="action-link" to={`/matches/${match.id}`}>
          {t("matches.openMatch", "Open match")} →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">{t("matches.kicker", "Fixtures")}</span>
        <h1 className="page-title">{t("matches.title", "Matches")}</h1>
      </div>

      <div className="league-tabs-wrap">
        <button
          type="button"
          className={`league-tab ${competitionFilter === "ALL" ? "league-tab-active" : ""}`}
          onClick={() => setCompetitionFilter("ALL")}
        >
          {t("common.all", "All")}
        </button>

        {competitionOptions.map((competition) => (
          <button
            key={competition}
            type="button"
            className={`league-tab ${competitionFilter === competition ? "league-tab-active" : ""}`}
            onClick={() => setCompetitionFilter(competition)}
          >
            {competition}
          </button>
        ))}
      </div>

      <div className="grid grid-4 matches-summary-grid" style={{ marginBottom: "22px" }}>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{t("common.all", "All")}</span>
          </div>
          <div className="standings-summary-value">{totalFilteredCount}</div>
          <p className="card-muted">{t("matches.filteredMatches", "All filtered matches.")}</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{t("common.live", "Live")}</span>
          </div>
          <div className="standings-summary-value">{groupedMatches.LIVE.length}</div>
          <p className="card-muted">{t("matches.liveNow", "Matches that are live now.")}</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{t("common.upcoming", "Upcoming")}</span>
          </div>
          <div className="standings-summary-value">{groupedMatches.UPCOMING.length}</div>
          <p className="card-muted">{t("matches.scheduled", "Scheduled matches.")}</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{t("common.finished", "Finished")}</span>
          </div>
          <div className="standings-summary-value">{groupedMatches.FINISHED.length}</div>
          <p className="card-muted">{t("matches.finishedDone", "Finished matches.")}</p>
        </div>
      </div>

      <div className="matches-toolbar matches-toolbar-compact">
        <input
          type="text"
          className="search-input"
          placeholder={t("matches.searchPlaceholder", "Search by team or tournament...")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select className="filter-select" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
          <option value="ALL">{t("matches.allSections", "All sections")}</option>
          <option value="LIVE">{t("matches.liveOnly", "Live only")}</option>
          <option value="UPCOMING">{t("matches.upcomingOnly", "Upcoming only")}</option>
          <option value="FINISHED">{t("matches.finishedOnly", "Finished only")}</option>
        </select>

        <select className="filter-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="date-desc">{t("matches.newestFirst", "Newest first")}</option>
          <option value="date-asc">{t("matches.oldestFirst", "Oldest first")}</option>
          <option value="teams-az">{t("matches.teamsAZ", "Teams A-Z")}</option>
          <option value="score-desc">{t("matches.highestScore", "Highest score")}</option>
        </select>

        <div className="view-switcher">
          <button type="button" className={viewMode === "grid" ? "view-switch-active" : ""} onClick={() => setViewMode("grid")}>
            {t("matches.grid", "Grid")}
          </button>
          <button type="button" className={viewMode === "list" ? "view-switch-active" : ""} onClick={() => setViewMode("list")}>
            {t("matches.list", "List")}
          </button>
        </div>
      </div>

      {lastUpdatedAt ? (
        <p className="results-count" style={{ marginTop: "10px" }}>
          {t("matches.autoRefresh", "Live auto-refresh")}: every 45s • {t("matches.updated", "Updated")}: {formatDateTimeFromMs(lastUpdatedAt, timezone)}
        </p>
      ) : null}

      {actionError ? <div className="error-state" style={{ marginBottom: "18px" }}>{actionError}</div> : null}
      {loading || favoritesLoading ? <div className="loading-state">{t("common.loading", "Loading...")}</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !favoritesLoading && !error ? (
        <div className="matches-sections">
          {sectionsToRender.map((sectionKey) => {
            const sectionMatches = groupedMatches[sectionKey] || [];
            const visibleMatches = sectionMatches.slice(0, visibleCount);

            return (
              <section className="matches-status-block" key={sectionKey}>
                <div className="section-header-row">
                  <h2 className="section-title" style={{ margin: 0 }}>
                    {sectionKey === "LIVE"
                      ? t("matches.liveTitle", "Live Matches")
                      : sectionKey === "UPCOMING"
                      ? t("matches.upcomingTitle", "Upcoming Matches")
                      : t("matches.finishedTitle", "Finished Matches")}
                  </h2>

                  <span className="results-count" style={{ margin: 0 }}>{sectionMatches.length}</span>
                </div>

                {!visibleMatches.length ? (
                  <div className="empty-state">{t("matches.noMatchesInSection", "No matches in this section.")}</div>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-2" : "grid"}>
                    {visibleMatches.map(renderMatchCard)}
                  </div>
                )}
              </section>
            );
          })}

          {hasMore ? (
            <div ref={loadMoreRef} className="loading-state" style={{ marginTop: "8px" }}>
              {t("matches.loadingMore", "Loading more matches...")}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
