import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson, postJson, postRequest } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";
import { useTimezone } from "../context/TimezoneContext";
import { useLanguage } from "../context/LanguageContext";
import { formatDateFromMs, formatDateTimeFromMs, parseMatchTimestamp } from "../utils/datetime";

const EXTERNAL_COMPETITION_CODES = {
  "Premier League": "PL",
  Bundesliga: "BL1",
  "La Liga": "PD",
  "Serie A": "SA",
  "Champions League": "CL",
};

const LIVE_REFRESH_MS = 45_000;

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [standings, setStandings] = useState([]);
  const [teamStatsMap, setTeamStatsMap] = useState({});
  const [selectedCompetition, setSelectedCompetition] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const { timezone } = useTimezone();
  const { t } = useLanguage();

  useEffect(() => {
    loadDashboard(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboard(true);
    }, LIVE_REFRESH_MS);

    return () => clearInterval(timer);
  }, [selectedCompetition]);

  useEffect(() => {
    if (!dashboard) return;
    loadLeagueData(selectedCompetition);
  }, [dashboard, selectedCompetition]);

  async function loadDashboard(silent = false) {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await fetchJson("/dashboard");
      const synced = await syncCurrentCompetitionMatches(data);
      setDashboard(synced ? await fetchJson("/dashboard") : data);
      setLastUpdatedAt(Date.now());
    } catch {
      if (!silent) {
        setError("Failed to load dashboard data.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function syncCurrentCompetitionMatches(dashboardData) {
    const seasonsData = dashboardData?.seasons || [];
    const targetSeason =
      selectedCompetition === "ALL"
        ? seasonsData[0] || null
        : seasonsData.find((season) => season.tournamentName === selectedCompetition) || null;

    if (!targetSeason?.id || !targetSeason?.tournamentName) return false;

    const competitionCode = EXTERNAL_COMPETITION_CODES[targetSeason.tournamentName];
    if (!competitionCode) return false;

    try {
      await postRequest(`/external/football/competitions/${competitionCode}/import-teams`);
      await postRequest(`/external/football/team-mappings/auto?competitionCode=${competitionCode}`);
      await postJson("/external/football/sync-matches", {
        competitionCode,
        seasonId: targetSeason.id,
      });
      return true;
    } catch {
      return false;
    }
  }

  async function loadLeagueData(competitionName) {
    setLeagueLoading(true);

    try {
      const seasons = dashboard?.seasons || [];

      let targetSeason = null;

      if (competitionName === "ALL") {
        targetSeason = seasons[0] || null;
      } else {
        targetSeason =
          seasons.find((season) => season.tournamentName === competitionName) || null;
      }

      if (!targetSeason?.id) {
        setStandings([]);
        setTeamStatsMap({});
        return;
      }

      const standingsData = await fetchJson(`/standings?seasonId=${targetSeason.id}`);
      setStandings(standingsData);

      const topTeams = standingsData.slice(0, 4);
      const statsEntries = await Promise.all(
        topTeams.map(async (team) => {
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
      setStandings([]);
      setTeamStatsMap({});
    } finally {
      setLeagueLoading(false);
    }
  }

  function getStatusClass(status) {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  function formatMatchDate(match) {
    return formatDateFromMs(parseMatchTimestamp(match), timezone);
  }

  function getDisplayStatus(match) {
    if (!match) return "SCHEDULED";

    const scheduledAtMs = parseMatchTimestamp(match);

    if (match.status === "FINISHED") return "FINISHED";
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

    return match.status || "SCHEDULED";
  }

  function getStatusSection(match) {
    const displayStatus = getDisplayStatus(match);
    if (displayStatus === "LIVE") return "LIVE";
    if (displayStatus === "FINISHED") return "FINISHED";

    const scheduledAtMs = parseMatchTimestamp(match);
    if (displayStatus === "SCHEDULED" && scheduledAtMs && scheduledAtMs < Date.now()) {
      return "FINISHED";
    }

    return "UPCOMING";
  }

  const seasons = dashboard?.seasons || [];
  const recentMatches = dashboard?.recentMatches || [];

  const competitionOptions = useMemo(() => {
    const names = seasons
      .map((season) => season.tournamentName)
      .filter(Boolean);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [seasons]);

  const filteredRecentMatches = useMemo(() => {
    if (selectedCompetition === "ALL") return recentMatches;

    return recentMatches.filter(
      (match) => match.tournamentName === selectedCompetition
    );
  }, [recentMatches, selectedCompetition]);

  const insights = useMemo(() => {
    if (!standings.length) {
      return {
        leader: null,
        bestAttack: null,
        bestDefense: null,
        mostWins: null,
      };
    }

    const leader = standings[0];

    const bestAttack = standings.reduce((best, row) =>
      !best || row.goalsFor > best.goalsFor ? row : best
    , null);

    const bestDefense = standings.reduce((best, row) =>
      !best || row.goalsAgainst < best.goalsAgainst ? row : best
    , null);

    const mostWins = standings.reduce((best, row) =>
      !best || row.wins > best.wins ? row : best
    , null);

    return { leader, bestAttack, bestDefense, mostWins };
  }, [standings]);

  const featuredTeams = useMemo(() => standings.slice(0, 4), [standings]);

  const { liveMatches, upcomingMatches, finishedMatches } = useMemo(() => {
    const live = [];
    const upcoming = [];
    const finished = [];

    for (const match of filteredRecentMatches) {
      const section = getStatusSection(match);
      if (section === "LIVE") live.push(match);
      else if (section === "FINISHED") finished.push(match);
      else upcoming.push(match);
    }

    const sortByDateDesc = (a, b) => (parseMatchTimestamp(b) || 0) - (parseMatchTimestamp(a) || 0);
    const sortByDateAsc = (a, b) => (parseMatchTimestamp(a) || 0) - (parseMatchTimestamp(b) || 0);

    live.sort(sortByDateDesc);
    finished.sort(sortByDateDesc);
    upcoming.sort(sortByDateAsc);

    return { liveMatches: live, upcomingMatches: upcoming, finishedMatches: finished };
  }, [filteredRecentMatches]);

  const liveMatchesPreview = useMemo(() => liveMatches.slice(0, 4), [liveMatches]);
  const upcomingMatchesPreview = useMemo(() => upcomingMatches.slice(0, 4), [upcomingMatches]);
  const finishedMatchesPreview = useMemo(() => finishedMatches.slice(0, 4), [finishedMatches]);

  if (loading) return <div className="loading-state">{t("home.loadingDashboard", "Loading dashboard...")}</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!dashboard) return <div className="empty-state">{t("home.noDashboardData", "No dashboard data.")}</div>;

  const selectedSeason =
    selectedCompetition === "ALL"
      ? seasons[0] || null
      : seasons.find((season) => season.tournamentName === selectedCompetition) || null;

  function renderMiniMatch(match) {
    return (
      <div key={match.id} className="home-mini-match-card">
        <div className="home-mini-match-top">
          <span className={getStatusClass(getDisplayStatus(match))}>
            {getDisplayStatus(match)}
          </span>
          <span className="mini-info-text">{formatMatchDate(match)}</span>
        </div>

        <div className="home-mini-match-teams">
          <div className="team-inline">
            <TeamLogo name={match.homeTeamName} logoUrl={match.homeTeamLogoUrl} size="sm" />
            <div className="team-inline-text">
              <div className="team-inline-name">{match.homeTeamName}</div>
            </div>
          </div>

          <div className="home-mini-score">
            {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
          </div>

          <div className="team-inline">
            <TeamLogo name={match.awayTeamName} logoUrl={match.awayTeamLogoUrl} size="sm" />
            <div className="team-inline-text">
              <div className="team-inline-name">{match.awayTeamName}</div>
            </div>
          </div>
        </div>

        <div className="mini-info-text">
          {match.tournamentName} • {match.seasonName}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="league-tabs-wrap" style={{ marginBottom: "18px" }}>
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

      {lastUpdatedAt ? (
        <p className="results-count" style={{ marginBottom: "14px" }}>
          {t("matches.autoRefresh", "Live auto-refresh")}: every 45s | {t("matches.updated", "Updated")}: {formatDateTimeFromMs(lastUpdatedAt, timezone)}
        </p>
      ) : null}

      <section className="home-hero premium-home-hero">
        <div className="home-hero-content">
          <div>
            <span className="page-kicker">{t("home.platformKicker", "Sports Analytics Platform")}</span>
            <h1 className="page-title">{t("home.heroTitle", "Real match data, standings, teams and favorites in one place")}</h1>
            <p className="page-subtitle">
              {t("home.heroSubtitle", "Platform for football fans with real matches, standings, team pages, favorites and external API synchronization.")}
            </p>

            <div className="hero-actions">
              <Link to="/matches" className="hero-button hero-button-primary">
                {t("home.exploreMatches", "Explore matches")}
              </Link>
              <Link to="/standings" className="hero-button hero-button-secondary">
                {t("home.openStandings", "Open standings")}
              </Link>
            </div>
          </div>
        </div>

        <div className="home-hero-side">
          <div className="hero-panel">
            <div className="hero-panel-label">{t("home.leagueSnapshot", "League snapshot")}</div>

            <div className="hero-panel-value">
              {selectedCompetition === "ALL" ? t("home.allLeagues", "All leagues") : selectedCompetition}
            </div>

            <div className="hero-panel-text" style={{ marginTop: "10px" }}>
              {selectedSeason
                ? `${selectedSeason.tournamentName} • ${selectedSeason.name}`
                : t("home.leagueNotSelected", "League is not selected")}
            </div>

            <div className="hero-mini-stats">
              <div className="hero-mini-stat">
                <span>Live</span>
                <strong>{liveMatches.length}</strong>
              </div>
              <div className="hero-mini-stat">
                <span>{t("common.upcoming", "Upcoming")}</span>
                <strong>{upcomingMatches.length}</strong>
              </div>
              <div className="hero-mini-stat">
                <span>{t("common.finished", "Finished")}</span>
                <strong>{finishedMatches.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-3" style={{ marginTop: "22px" }}>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Live</span>
          </div>
          <div className="hero-panel-value stat-card-value">{liveMatches.length}</div>
          <p className="card-muted">{t("home.liveNowDesc", "Matches that are currently live.")}</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Finished</span>
          </div>
          <div className="hero-panel-value stat-card-value">{finishedMatches.length}</div>
          <p className="card-muted">{t("home.completedDesc", "Completed matches.")}</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Upcoming</span>
          </div>
          <div className="hero-panel-value stat-card-value">{upcomingMatches.length}</div>
          <p className="card-muted">{t("home.scheduledDesc", "Scheduled matches.")}</p>
        </div>
      </div>

      {leagueLoading ? (
        <div className="loading-state" style={{ marginTop: "22px" }}>
          {t("home.loadingLeagueData", "Loading league data...")}
        </div>
      ) : (
        <>
          <div className="grid grid-2" style={{ marginTop: "22px" }}>
            <div className="card analytics-card">
              <div className="section-header-row">
                <h2 className="section-title" style={{ margin: 0 }}>{t("home.leagueInsights", "League Insights")}</h2>
                <Link className="action-link" to="/standings">{t("home.fullTable", "Full table")} →</Link>
              </div>

              {!insights.leader ? (
                <div className="empty-state">{t("home.noInsightData", "No standings data available for insights.")}</div>
              ) : (
                <div className="grid" style={{ gap: "12px" }}>
                  <div className="insight-row">
                    <div className="insight-label">{t("home.leader", "Leader")}</div>
                    <div className="insight-value-wrap">
                      <TeamLogo name={insights.leader.teamName} logoUrl={insights.leader.teamLogoUrl} size="sm" />
                      <div>
                        <div className="mini-info-title">{insights.leader.teamName}</div>
                        <div className="mini-info-text">{insights.leader.points} {t("home.pts", "pts")}</div>
                      </div>
                    </div>
                  </div>

                  <div className="insight-row">
                    <div className="insight-label">{t("home.bestAttack", "Best attack")}</div>
                    <div className="insight-value-wrap">
                      <TeamLogo name={insights.bestAttack.teamName} logoUrl={insights.bestAttack.teamLogoUrl} size="sm" />
                      <div>
                        <div className="mini-info-title">{insights.bestAttack.teamName}</div>
                        <div className="mini-info-text">{insights.bestAttack.goalsFor} {t("home.goalsScored", "goals scored")}</div>
                      </div>
                    </div>
                  </div>

                  <div className="insight-row">
                    <div className="insight-label">{t("home.bestDefense", "Best defense")}</div>
                    <div className="insight-value-wrap">
                      <TeamLogo name={insights.bestDefense.teamName} logoUrl={insights.bestDefense.teamLogoUrl} size="sm" />
                      <div>
                        <div className="mini-info-title">{insights.bestDefense.teamName}</div>
                        <div className="mini-info-text">{insights.bestDefense.goalsAgainst} {t("home.goalsConceded", "goals conceded")}</div>
                      </div>
                    </div>
                  </div>

                  <div className="insight-row">
                    <div className="insight-label">{t("home.mostWins", "Most wins")}</div>
                    <div className="insight-value-wrap">
                      <TeamLogo name={insights.mostWins.teamName} logoUrl={insights.mostWins.teamLogoUrl} size="sm" />
                      <div>
                        <div className="mini-info-title">{insights.mostWins.teamName}</div>
                        <div className="mini-info-text">{insights.mostWins.wins} {t("home.wins", "wins")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-header-row">
                <h2 className="section-title" style={{ margin: 0 }}>{t("home.topStandings", "Top Standings")}</h2>
                <Link className="action-link" to="/standings">{t("home.fullTable", "Full table")} →</Link>
              </div>

              {!standings.length ? (
                <div className="empty-state">{t("home.noStandingsFound", "No standings found.")}</div>
              ) : (
                <div className="table-wrap">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t("home.team", "Team")}</th>
                        <th>P</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.slice(0, 5).map((row) => (
                        <tr key={row.id}>
                          <td>{row.position}</td>
                          <td>
                            <div className="standings-team-wrap">
                              <TeamLogo name={row.teamName} logoUrl={row.teamLogoUrl} size="sm" />
                              <span className="team-cell">{row.teamName}</span>
                            </div>
                          </td>
                          <td>{row.played}</td>
                          <td className="points-cell">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedSeason ? (
                <p className="results-count" style={{ marginTop: "14px", marginBottom: 0 }}>
                  {t("home.season", "Season")}: {selectedSeason.tournamentName ? `${selectedSeason.tournamentName} • ${selectedSeason.name}` : selectedSeason.name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ marginTop: "22px" }}>
            <div className="section-header-row">
              <h2 className="section-title" style={{ margin: 0 }}>{t("home.featuredTeams", "Featured Teams")}</h2>
              <Link className="action-link" to="/teams">{t("home.allTeams", "All teams")} →</Link>
            </div>

            {!featuredTeams.length ? (
              <div className="empty-state">{t("home.noFeaturedTeams", "No featured teams found.")}</div>
            ) : (
              <div className="grid grid-2">
                {featuredTeams.map((team) => {
                  const stats = teamStatsMap[team.teamId];

                  return (
                    <div className="featured-team-card" key={team.teamId}>
                      <div className="featured-team-top">
                        <div className="standings-team-wrap">
                          <TeamLogo name={team.teamName} logoUrl={team.teamLogoUrl} size="sm" />
                          <div>
                            <div className="mini-info-title">{team.teamName}</div>
                            <div className="mini-info-text">{t("home.position", "Position")} #{team.position}</div>
                          </div>
                        </div>

                        <div className="featured-team-points">{team.points} {t("home.pts", "pts")}</div>
                      </div>

                      <div className="featured-team-stats">
                        <div className="featured-team-stat"><span>{t("home.wins", "Wins")}</span><strong>{team.wins}</strong></div>
                        <div className="featured-team-stat"><span>GD</span><strong>{team.goalDifference}</strong></div>
                        <div className="featured-team-stat"><span>{t("home.winRate", "Win rate")}</span><strong>{stats ? `${stats.winRate}%` : "-"}</strong></div>
                        <div className="featured-team-stat"><span>{t("home.goals", "Goals")}</span><strong>{stats ? stats.goalsFor : "-"}</strong></div>
                      </div>

                      <Link className="action-link" to={`/teams/${team.teamId}`}>{t("home.openTeam", "Open team")} →</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="home-match-shell" style={{ marginTop: "22px" }}>
        <div className="card home-match-primary">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>{t("home.liveNowTitle", "Live Now")}</h2>
            <Link className="action-link" to="/matches">{t("common.open", "Open")} →</Link>
          </div>

          {!liveMatchesPreview.length ? (
            <div className="empty-state">{t("home.noLiveNow", "No live matches right now.")}</div>
          ) : (
            <div className="grid" style={{ gap: "12px" }}>
              {liveMatchesPreview.map(renderMiniMatch)}
            </div>
          )}
        </div>

        <div className="home-match-secondary">
          <div className="card">
            <div className="section-header-row">
              <h2 className="section-title" style={{ margin: 0 }}>{t("common.upcoming", "Upcoming")}</h2>
              <Link className="action-link" to="/matches">{t("common.open", "Open")} →</Link>
            </div>

            {!upcomingMatchesPreview.length ? (
              <div className="empty-state">{t("home.noUpcoming", "No upcoming matches.")}</div>
            ) : (
              <div className="grid" style={{ gap: "12px" }}>
                {upcomingMatchesPreview.map(renderMiniMatch)}
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-header-row">
              <h2 className="section-title" style={{ margin: 0 }}>{t("home.latestResults", "Latest Results")}</h2>
              <Link className="action-link" to="/matches">{t("common.open", "Open")} →</Link>
            </div>

            {!finishedMatchesPreview.length ? (
              <div className="empty-state">{t("home.noFinishedYet", "No finished matches yet.")}</div>
            ) : (
              <div className="grid" style={{ gap: "12px" }}>
                {finishedMatchesPreview.map(renderMiniMatch)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card">
          <h2 className="section-title">{t("home.availableSeasons", "Available Seasons")}</h2>

          {!seasons.length ? (
            <div className="empty-state">{t("home.noSeasons", "No seasons found.")}</div>
          ) : (
            <div className="season-pills">
              {seasons.map((season) => (
                <div key={season.id} className="season-pill">
                  <div className="mini-info-title">{season.tournamentName || t("home.tournament", "Tournament")}</div>
                  <div className="mini-info-text">{season.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">{t("home.quickNavigation", "Quick Navigation")}</h2>

          <div className="grid" style={{ gap: "12px" }}>
            <Link to="/teams" className="mini-info-card">
              <div className="mini-info-title">{t("header.teams", "Teams")}</div>
              <div className="mini-info-text">{t("home.browseTeams", "Browse teams, details and recent form.")}</div>
            </Link>

            <Link to="/matches" className="mini-info-card">
              <div className="mini-info-title">{t("header.matches", "Matches")}</div>
              <div className="mini-info-text">{t("home.browseMatches", "Match list with filters, details and favorites.")}</div>
            </Link>

            <Link to="/favorites" className="mini-info-card">
              <div className="mini-info-title">{t("header.favorites", "Favorites")}</div>
              <div className="mini-info-text">{t("home.browseFavorites", "Favorite teams and matches for current user.")}</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
