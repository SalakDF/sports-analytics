import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

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

  function getStatusClass(status) {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  if (loading) return <div className="loading-state">Loading dashboard...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!dashboard) return <div className="empty-state">No dashboard data.</div>;

  const recentMatches = dashboard.recentMatches || [];
  const topStandings = dashboard.topStandings || [];
  const seasons = dashboard.seasons || [];

  return (
    <div>
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
            <div className="hero-panel-label">Current snapshot</div>
            <div className="hero-panel-value">
              {dashboard.scheduledMatchesCount ?? 0} scheduled
            </div>
            <div className="hero-panel-text">
              Dashboard працює через єдиний endpoint, а система вже вміє
              синхронізувати реальні зовнішні матчі у внутрішню базу даних.
            </div>

            <div className="hero-mini-stats">
              <div className="hero-mini-stat">
                <span>Live</span>
                <strong>{dashboard.liveMatchesCount ?? 0}</strong>
              </div>
              <div className="hero-mini-stat">
                <span>Finished</span>
                <strong>{dashboard.finishedMatchesCount ?? 0}</strong>
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
          <div className="hero-panel-value stat-card-value">
            {dashboard.liveMatchesCount ?? 0}
          </div>
          <p className="card-muted">Матчі, які зараз тривають.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Finished</span>
          </div>
          <div className="hero-panel-value stat-card-value">
            {dashboard.finishedMatchesCount ?? 0}
          </div>
          <p className="card-muted">Матчі, які вже завершились.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Upcoming</span>
          </div>
          <div className="hero-panel-value stat-card-value">
            {dashboard.scheduledMatchesCount ?? 0}
          </div>
          <p className="card-muted">Матчі, заплановані на найближчий час.</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Recent Matches
            </h2>
            <Link className="action-link" to="/matches">
              All matches →
            </Link>
          </div>

          {!recentMatches.length ? (
            <div className="empty-state">No matches found.</div>
          ) : (
            <div className="grid" style={{ gap: "14px" }}>
              {recentMatches.map((match) => (
                <div key={match.id} className="match-preview-card">
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

                    <div style={{ textAlign: "right" }}>
                      <div className="score-value home-score-preview">
                        {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                      </div>
                      <span className={getStatusClass(match.status)}>
                        {match.status}
                      </span>
                    </div>
                  </div>

                  <p className="card-muted" style={{ marginTop: "14px" }}>
                    {match.tournamentName} • {match.seasonName}
                  </p>

                  <div className="meta-row">
                    <span className="badge">{match.roundName || "Round -"}</span>
                    <span className="badge">
                      {match.scheduledAt
                        ? new Date(match.scheduledAt).toLocaleString()
                        : "Date not available"}
                    </span>
                  </div>

                  <Link className="action-link" to={`/matches/${match.id}`}>
                    Open match →
                  </Link>
                </div>
              ))}
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

          {!topStandings.length ? (
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
                  {topStandings.map((row) => (
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

          {topStandings[0]?.seasonName ? (
            <p className="results-count" style={{ marginTop: "14px", marginBottom: 0 }}>
              Season:{" "}
              {topStandings[0].tournamentName
                ? `${topStandings[0].tournamentName} • ${topStandings[0].seasonName}`
                : topStandings[0].seasonName}
            </p>
          ) : null}
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