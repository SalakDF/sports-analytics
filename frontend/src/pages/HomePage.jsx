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

  const getStatusClass = (status) => {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  };

  if (loading) return <div className="loading-state">Loading dashboard...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!dashboard) return <div className="empty-state">No dashboard data.</div>;

  const recentMatches = dashboard.recentMatches || [];
  const topStandings = dashboard.topStandings || [];
  const seasons = dashboard.seasons || [];

  return (
    <div>
      <section className="home-hero">
        <div className="home-hero-content">
          <div>
            <span className="page-kicker">Sports Analytics Platform</span>
            <h1 className="page-title">
              Analytics, results, standings and favorites in one place
            </h1>
            <p className="page-subtitle">
              Веб-застосунок для спортивних любителів із результатами матчів,
              турнірними таблицями, командами, базовою аналітикою та обраним.
            </p>

            <div className="hero-actions">
              <Link to="/matches" className="hero-button hero-button-primary">
                Open matches
              </Link>
              <Link to="/standings" className="hero-button hero-button-secondary">
                View standings
              </Link>
            </div>
          </div>
        </div>

        <div className="home-hero-side">
          <div className="hero-panel">
            <div className="hero-panel-label">Current snapshot</div>
            <div className="hero-panel-value">
              {recentMatches.length} recent matches
            </div>
            <div className="hero-panel-text">
              Головна сторінка тепер працює через єдиний dashboard endpoint і
              показує ключові спортивні дані без зайвих окремих запитів.
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-3" style={{ marginTop: "22px" }}>
        <div className="card">
          <h3 className="card-title">Live now</h3>
          <p className="card-muted">Matches currently in LIVE status.</p>
          <div className="hero-panel-value" style={{ fontSize: "32px", marginBottom: 0 }}>
            {dashboard.liveMatchesCount ?? 0}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Finished</h3>
          <p className="card-muted">Completed matches in the system.</p>
          <div className="hero-panel-value" style={{ fontSize: "32px", marginBottom: 0 }}>
            {dashboard.finishedMatchesCount ?? 0}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Scheduled</h3>
          <p className="card-muted">Upcoming matches waiting to start.</p>
          <div className="hero-panel-value" style={{ fontSize: "32px", marginBottom: 0 }}>
            {dashboard.scheduledMatchesCount ?? 0}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
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
                <div
                  key={match.id}
                  className="card"
                  style={{ padding: "16px", background: "rgba(255,255,255,0.02)" }}
                >
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
                      <div
                        className="score-value"
                        style={{ fontSize: "28px", marginBottom: "8px" }}
                      >
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

                  <Link className="action-link" to={`/matches/${match.id}`}>
                    Open match →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
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
            <div className="grid" style={{ gap: "12px" }}>
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="mini-info-card"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
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
                Перегляд команд, деталей і пошуку через backend API.
              </div>
            </Link>

            <Link to="/matches" className="mini-info-card">
              <div className="mini-info-title">Matches</div>
              <div className="mini-info-text">
                Матчі з пошуком, статус-фільтром і деталями.
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