import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [standings, setStandings] = useState([]);
  const [teamStatsMap, setTeamStatsMap] = useState({});
  const [selectedCompetition, setSelectedCompetition] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!dashboard) return;
    loadLeagueData(selectedCompetition);
  }, [dashboard, selectedCompetition]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson("/dashboard");
      setDashboard(data);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
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

  const liveMatches = useMemo(
    () => filteredRecentMatches.filter((m) => m.status === "LIVE").slice(0, 4),
    [filteredRecentMatches]
  );

  const upcomingMatches = useMemo(
    () =>
      filteredRecentMatches
        .filter((m) => m.status !== "LIVE" && m.status !== "FINISHED")
        .slice(0, 4),
    [filteredRecentMatches]
  );

  const finishedMatches = useMemo(
    () => filteredRecentMatches.filter((m) => m.status === "FINISHED").slice(0, 4),
    [filteredRecentMatches]
  );

  if (loading) return <div className="loading-state">Loading dashboard...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!dashboard) return <div className="empty-state">No dashboard data.</div>;

  const selectedSeason =
    selectedCompetition === "ALL"
      ? seasons[0] || null
      : seasons.find((season) => season.tournamentName === selectedCompetition) || null;

  function renderMiniMatch(match) {
    return (
      <div key={match.id} className="home-mini-match-card">
        <div className="home-mini-match-top">
          <span className={getStatusClass(match.status)}>{match.status}</span>
          <span className="mini-info-text">
            {match.scheduledAt
              ? new Date(match.scheduledAt).toLocaleDateString()
              : "No date"}
          </span>
        </div>

        <div className="home-mini-match-teams">
          <div className="team-inline">
            <TeamLogo
              name={match.homeTeamName}
              logoUrl={match.homeTeamLogoUrl}
              size="sm"
            />
            <div className="team-inline-text">
              <div className="team-inline-name">{match.homeTeamName}</div>
            </div>
          </div>

          <div className="home-mini-score">
            {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
          </div>

          <div className="team-inline">
            <TeamLogo
              name={match.awayTeamName}
              logoUrl={match.awayTeamLogoUrl}
              size="sm"
            />
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
          All
        </button>

        {competitionOptions.map((competition) => (
          <button
            key={competition}
            type="button"
            className={`league-tab ${
              selectedCompetition === competition ? "league-tab-active" : ""
            }`}
            onClick={() => setSelectedCompetition(competition)}
          >
            {competition}
          </button>
        ))}
      </div>

      <section className="home-hero premium-home-hero">
        <div className="home-hero-content">
          <div>
            <span className="page-kicker">Sports Analytics Platform</span>
            <h1 className="page-title">
              Real match data, standings, teams and favorites in one place
            </h1>
            <p className="page-subtitle">
              Платформа для спортивних любителів із внутрішньою системою матчів,
              турнірних таблиць, команд, favorites та інтеграцією із зовнішнім
              футбольним API.
            </p>

            <div className="hero-actions">
              <Link to="/matches" className="hero-button hero-button-primary">
                Explore matches
              </Link>
              <Link to="/standings" className="hero-button hero-button-secondary">
                Open standings
              </Link>
            </div>
          </div>
        </div>

        <div className="home-hero-side">
          <div className="hero-panel">
            <div className="hero-panel-label">League snapshot</div>

            <div className="hero-panel-value">
              {selectedCompetition === "ALL" ? "All leagues" : selectedCompetition}
            </div>

            <div className="hero-panel-text" style={{ marginTop: "10px" }}>
              {selectedSeason
                ? `${selectedSeason.tournamentName} • ${selectedSeason.name}`
                : "League is not selected"}
            </div>

            <div className="hero-mini-stats">
              <div className="hero-mini-stat">
                <span>Live</span>
                <strong>{liveMatches.length}</strong>
              </div>
              <div className="hero-mini-stat">
                <span>Upcoming</span>
                <strong>{upcomingMatches.length}</strong>
              </div>
              <div className="hero-mini-stat">
                <span>Finished</span>
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
          <p className="card-muted">Матчі, які зараз тривають.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Finished</span>
          </div>
          <div className="hero-panel-value stat-card-value">{finishedMatches.length}</div>
          <p className="card-muted">Матчі, які вже завершились.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Upcoming</span>
          </div>
          <div className="hero-panel-value stat-card-value">{upcomingMatches.length}</div>
          <p className="card-muted">Матчі, заплановані на найближчий час.</p>
        </div>
      </div>

      {leagueLoading ? (
        <div className="loading-state" style={{ marginTop: "22px" }}>
          Loading league data...
        </div>
      ) : (
        <>
          <div className="grid grid-2" style={{ marginTop: "22px" }}>
            <div className="card analytics-card">
              <div className="section-header-row">
                <h2 className="section-title" style={{ margin: 0 }}>
                  League Insights
                </h2>
                <Link className="action-link" to="/standings">
                  Full table →
                </Link>
              </div>

              {!insights.leader ? (
                <div className="empty-state">No standings data available for insights.</div>
              ) : (
                <div className="grid" style={{ gap: "12px" }}>
                  <div className="insight-row">
                    <div className="insight-label">Leader</div>
                    <div className="insight-value-wrap">
                      <TeamLogo
                        name={insights.leader.teamName}
                        logoUrl={insights.leader.teamLogoUrl}
                        size="sm"
                      />
                      <div>
                        <div className="mini-info-title">{insights.leader.teamName}</div>
                        <div className="mini-info-text">
                          {insights.leader.points} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="insight-row">
                    <div className="insight-label">Best attack</div>
                    <div className="insight-value-wrap">
                      <TeamLogo
                        name={insights.bestAttack.teamName}
                        logoUrl={insights.bestAttack.teamLogoUrl}
                        size="sm"
                      />
                      <div>
                        <div className="mini-info-title">{insights.bestAttack.teamName}</div>
                        <div className="mini-info-text">
                          {insights.bestAttack.goalsFor} goals scored
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="insight-row">
                    <div className="insight-label">Best defense</div>
                    <div className="insight-value-wrap">
                      <TeamLogo
                        name={insights.bestDefense.teamName}
                        logoUrl={insights.bestDefense.teamLogoUrl}
                        size="sm"
                      />
                      <div>
                        <div className="mini-info-title">{insights.bestDefense.teamName}</div>
                        <div className="mini-info-text">
                          {insights.bestDefense.goalsAgainst} goals conceded
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="insight-row">
                    <div className="insight-label">Most wins</div>
                    <div className="insight-value-wrap">
                      <TeamLogo
                        name={insights.mostWins.teamName}
                        logoUrl={insights.mostWins.teamLogoUrl}
                        size="sm"
                      />
                      <div>
                        <div className="mini-info-title">{insights.mostWins.teamName}</div>
                        <div className="mini-info-text">
                          {insights.mostWins.wins} wins
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-header-row">
                <h2 className="section-title" style={{ margin: 0 }}>
                  Top Standings
                </h2>
                <Link className="action-link" to="/standings">
                  Full table →
                </Link>
              </div>

              {!standings.length ? (
                <div className="empty-state">No standings found.</div>
              ) : (
                <div className="table-wrap">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Team</th>
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
                              <TeamLogo
                                name={row.teamName}
                                logoUrl={row.teamLogoUrl}
                                size="sm"
                              />
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
                  Season:{" "}
                  {selectedSeason.tournamentName
                    ? `${selectedSeason.tournamentName} • ${selectedSeason.name}`
                    : selectedSeason.name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ marginTop: "22px" }}>
            <div className="section-header-row">
              <h2 className="section-title" style={{ margin: 0 }}>
                Featured Teams
              </h2>
              <Link className="action-link" to="/teams">
                All teams →
              </Link>
            </div>

            {!featuredTeams.length ? (
              <div className="empty-state">No featured teams found.</div>
            ) : (
              <div className="grid grid-2">
                {featuredTeams.map((team) => {
                  const stats = teamStatsMap[team.teamId];

                  return (
                    <div className="featured-team-card" key={team.teamId}>
                      <div className="featured-team-top">
                        <div className="standings-team-wrap">
                          <TeamLogo
                            name={team.teamName}
                            logoUrl={team.teamLogoUrl}
                            size="sm"
                          />
                          <div>
                            <div className="mini-info-title">{team.teamName}</div>
                            <div className="mini-info-text">
                              Position #{team.position}
                            </div>
                          </div>
                        </div>

                        <div className="featured-team-points">{team.points} pts</div>
                      </div>

                      <div className="featured-team-stats">
                        <div className="featured-team-stat">
                          <span>Wins</span>
                          <strong>{team.wins}</strong>
                        </div>

                        <div className="featured-team-stat">
                          <span>GD</span>
                          <strong>{team.goalDifference}</strong>
                        </div>

                        <div className="featured-team-stat">
                          <span>Win rate</span>
                          <strong>{stats ? `${stats.winRate}%` : "-"}</strong>
                        </div>

                        <div className="featured-team-stat">
                          <span>Goals</span>
                          <strong>{stats ? stats.goalsFor : "-"}</strong>
                        </div>
                      </div>

                      <Link className="action-link" to={`/teams/${team.teamId}`}>
                        Open team →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="grid grid-3" style={{ marginTop: "22px" }}>
        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Live Now
            </h2>
            <Link className="action-link" to="/matches">
              Open →
            </Link>
          </div>

          {!liveMatches.length ? (
            <div className="empty-state">No live matches right now.</div>
          ) : (
            <div className="grid" style={{ gap: "12px" }}>
              {liveMatches.map(renderMiniMatch)}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Upcoming
            </h2>
            <Link className="action-link" to="/matches">
              Open →
            </Link>
          </div>

          {!upcomingMatches.length ? (
            <div className="empty-state">No upcoming matches.</div>
          ) : (
            <div className="grid" style={{ gap: "12px" }}>
              {upcomingMatches.map(renderMiniMatch)}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Latest Results
            </h2>
            <Link className="action-link" to="/matches">
              Open →
            </Link>
          </div>

          {!finishedMatches.length ? (
            <div className="empty-state">No finished matches yet.</div>
          ) : (
            <div className="grid" style={{ gap: "12px" }}>
              {finishedMatches.map(renderMiniMatch)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card">
          <h2 className="section-title">Available Seasons</h2>

          {!seasons.length ? (
            <div className="empty-state">No seasons found.</div>
          ) : (
            <div className="season-pills">
              {seasons.map((season) => (
                <div key={season.id} className="season-pill">
                  <div className="mini-info-title">
                    {season.tournamentName || "Tournament"}
                  </div>
                  <div className="mini-info-text">{season.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">Quick Navigation</h2>

          <div className="grid" style={{ gap: "12px" }}>
            <Link to="/teams" className="mini-info-card">
              <div className="mini-info-title">Teams</div>
              <div className="mini-info-text">
                Перегляд команд, деталей і recent form.
              </div>
            </Link>

            <Link to="/matches" className="mini-info-card">
              <div className="mini-info-title">Matches</div>
              <div className="mini-info-text">
                Список матчів з фільтрами, деталями і favorites.
              </div>
            </Link>

            <Link to="/favorites" className="mini-info-card">
              <div className="mini-info-title">Favorites</div>
              <div className="mini-info-text">
                Улюблені команди та матчі поточного користувача.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}