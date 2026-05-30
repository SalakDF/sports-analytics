import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";

export default function TeamDetailsPage() {
  const { id } = useParams();

  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteError, setFavoriteError] = useState("");

  useEffect(() => {
    fetchJson(`/teams/${id}`)
      .then((data) => setTeam(data))
      .catch(() => setError("Failed to load team details."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchJson(`/teams/${id}/stats`)
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [id]);

  useEffect(() => {
    fetchJson(`/teams/${id}/recent-matches`)
      .then((data) => setRecentMatches(data))
      .catch(() => setRecentMatches([]))
      .finally(() => setRecentLoading(false));
  }, [id]);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user?.id) {
      setIsFavorite(false);
      return;
    }

    fetchJson(`/favorites/teams?userId=${user.id}`)
      .then((favorites) => {
        const exists = favorites.some(
          (favoriteTeam) => String(favoriteTeam.teamId) === String(id)
        );
        setIsFavorite(exists);
      })
      .catch(() => setIsFavorite(false));
  }, [id]);

  async function handleFavoriteAction() {
    const user = getCurrentUser();

    setFavoriteMessage("");
    setFavoriteError("");

    if (!user?.id) {
      setFavoriteError("Please login first to manage favorites.");
      return;
    }

    setFavoriteLoading(true);

    try {
      await apiRequest(`/favorites/teams?userId=${user.id}&teamId=${id}`, {
        method: isFavorite ? "DELETE" : "POST",
      });

      if (isFavorite) {
        setIsFavorite(false);
        setFavoriteMessage("Team removed from favorites.");
      } else {
        setIsFavorite(true);
        setFavoriteMessage("Team added to favorites.");
      }
    } catch {
      setFavoriteError("Failed to update favorite team.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  const recentForm = useMemo(() => {
    return recentMatches.map((match) => {
      const isHome = String(match.homeTeamId) === String(id);
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      let result = "D";
      if (teamScore > opponentScore) result = "W";
      if (teamScore < opponentScore) result = "L";

      return {
        ...match,
        result,
        opponentName: isHome ? match.awayTeamName : match.homeTeamName,
      };
    });
  }, [recentMatches, id]);

  const formChartData = useMemo(() => {
    return [...recentForm]
      .slice(0, 5)
      .reverse()
      .map((match, index) => {
        const isHome = String(match.homeTeamId) === String(id);
        const goalsFor = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
        const goalsAgainst = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);

        const points =
          match.result === "W" ? 3 : match.result === "D" ? 1 : 0;

        return {
          id: match.id,
          label: `M${index + 1}`,
          opponentName: match.opponentName,
          result: match.result,
          points,
          goalsFor,
          goalsAgainst,
        };
      });
  }, [recentForm, id]);

  const lineChartPoints = useMemo(() => {
    if (!formChartData.length) return "";

    const width = 320;
    const height = 120;

    return formChartData
      .map((item, index) => {
        const x =
          formChartData.length === 1
            ? width / 2
            : (index / (formChartData.length - 1)) * width;

        const y = height - (item.points / 3) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [formChartData]);

  const pointMarkers = useMemo(() => {
    if (!formChartData.length) return [];

    const width = 320;
    const height = 120;

    return formChartData.map((item, index) => {
      const x =
        formChartData.length === 1
          ? width / 2
          : (index / (formChartData.length - 1)) * width;

      const y = height - (item.points / 3) * height;

      return {
        ...item,
        x,
        y,
      };
    });
  }, [formChartData]);

  const maxGoalsValue = useMemo(() => {
    if (!formChartData.length) return 1;

    return Math.max(
      1,
      ...formChartData.flatMap((item) => [item.goalsFor, item.goalsAgainst])
    );
  }, [formChartData]);

  if (loading) return <div className="loading-state">Loading team details...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!team) return <div className="empty-state">Team not found.</div>;

  return (
    <div>
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-top-row">
            <span className="page-kicker">Club Profile</span>

            <div className="meta-row">
              <span className="badge">{team.country || "Country -"}</span>
              <span className="badge">Founded: {team.foundedYear || "-"}</span>
              <span className="badge">{team.shortName || "No short name"}</span>
            </div>
          </div>

          <div className="detail-hero-brand">
            <TeamLogo
              name={team.name}
              shortName={team.shortName}
              logoUrl={team.logoUrl}
              size="lg"
            />

            <div className="detail-hero-brand-text">
              <h1 className="detail-title">{team.name}</h1>
              <p className="detail-subtitle">
                Детальна інформація про команду, статистика, recent form та
                керування favorites.
              </p>
            </div>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className={
                isFavorite
                  ? "hero-button hero-button-secondary"
                  : "hero-button hero-button-primary"
              }
              onClick={handleFavoriteAction}
              disabled={favoriteLoading}
            >
              {favoriteLoading
                ? "Please wait..."
                : isFavorite
                ? "Remove from favorites"
                : "Add to favorites"}
            </button>

            <Link to="/teams" className="hero-button hero-button-secondary">
              Back to teams
            </Link>
          </div>

          {favoriteMessage ? (
            <div className="loading-state" style={{ marginTop: "16px" }}>
              {favoriteMessage}
            </div>
          ) : null}

          {favoriteError ? (
            <div className="error-state" style={{ marginTop: "16px" }}>
              {favoriteError}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card detail-card">
          <h2 className="section-title">Overview</h2>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Full name</span>
              <span className="detail-info-value">{team.name || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Short name</span>
              <span className="detail-info-value">{team.shortName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Country</span>
              <span className="detail-info-value">{team.country || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Founded year</span>
              <span className="detail-info-value">{team.foundedYear || "-"}</span>
            </div>
          </div>
        </div>

        <div className="card detail-card">
          <h2 className="section-title">Description</h2>
          <p className="detail-paragraph">
            {team.description || "No description available for this team yet."}
          </p>
        </div>
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">Team Statistics</h2>

        {statsLoading ? (
          <div className="loading-state">Loading team stats...</div>
        ) : !stats ? (
          <div className="empty-state">No team stats available.</div>
        ) : (
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Matches played</span>
              <span className="detail-info-value">{stats.matchesPlayed}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Wins</span>
              <span className="detail-info-value">{stats.wins}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Draws</span>
              <span className="detail-info-value">{stats.draws}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Losses</span>
              <span className="detail-info-value">{stats.losses}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Goals scored</span>
              <span className="detail-info-value">{stats.goalsFor}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Goals conceded</span>
              <span className="detail-info-value">{stats.goalsAgainst}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Goal difference</span>
              <span className="detail-info-value">{stats.goalDifference}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Win rate</span>
              <span className="detail-info-value">{stats.winRate}%</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Avg goals scored</span>
              <span className="detail-info-value">{stats.averageGoalsFor}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Avg goals conceded</span>
              <span className="detail-info-value">{stats.averageGoalsAgainst}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Clean sheets</span>
              <span className="detail-info-value">{stats.cleanSheets}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">Form Chart</h2>

        {recentLoading ? (
          <div className="loading-state">Loading form chart...</div>
        ) : !formChartData.length ? (
          <div className="empty-state">Not enough recent matches for chart.</div>
        ) : (
          <div className="team-form-chart-layout">
            <div className="team-form-line-card">
              <div className="mini-info-title" style={{ marginBottom: "10px" }}>
                Points by last 5 matches
              </div>

              <div className="team-form-line-wrap">
                <div className="team-form-y-axis">
                  <span>3</span>
                  <span>2</span>
                  <span>1</span>
                  <span>0</span>
                </div>

                <div className="team-form-svg-wrap">
                  <svg
                    viewBox="0 0 320 120"
                    className="team-form-line-svg"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="0" x2="320" y2="0" className="chart-grid-line" />
                    <line x1="0" y1="40" x2="320" y2="40" className="chart-grid-line" />
                    <line x1="0" y1="80" x2="320" y2="80" className="chart-grid-line" />
                    <line x1="0" y1="120" x2="320" y2="120" className="chart-grid-line" />

                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      points={lineChartPoints}
                      className="team-form-polyline"
                    />

                    {pointMarkers.map((item) => (
                      <circle
                        key={item.id}
                        cx={item.x}
                        cy={item.y}
                        r="5"
                        className={`team-form-point team-form-point-${item.result.toLowerCase()}`}
                      />
                    ))}
                  </svg>

                  <div className="team-form-x-axis">
                    {formChartData.map((item) => (
                      <div key={item.id} className="team-form-x-item">
                        <span>{item.label}</span>
                        <small>{item.result}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="team-form-bars-card">
              <div className="mini-info-title" style={{ marginBottom: "10px" }}>
                Goals scored vs conceded
              </div>

              <div className="team-goals-bars">
                {formChartData.map((item) => (
                  <div key={item.id} className="team-goals-bar-row">
                    <div className="team-goals-bar-label">
                      <span>{item.label}</span>
                      <small>vs {item.opponentName}</small>
                    </div>

                    <div className="team-goals-bar-pair">
                      <div className="team-goals-bar-track">
                        <div
                          className="team-goals-bar team-goals-bar-for"
                          style={{
                            width: `${(item.goalsFor / maxGoalsValue) * 100}%`,
                          }}
                        />
                      </div>

                      <span className="team-goals-bar-value">{item.goalsFor}</span>

                      <div className="team-goals-bar-track">
                        <div
                          className="team-goals-bar team-goals-bar-against"
                          style={{
                            width: `${(item.goalsAgainst / maxGoalsValue) * 100}%`,
                          }}
                        />
                      </div>

                      <span className="team-goals-bar-value">{item.goalsAgainst}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">Recent Form</h2>

        {recentLoading ? (
          <div className="loading-state">Loading recent form...</div>
        ) : !recentForm.length ? (
          <div className="empty-state">No recent finished matches found.</div>
        ) : (
          <>
            <div className="form-badges-row">
              {recentForm.map((item) => (
                <span
                  key={item.id}
                  className={`form-badge form-badge-${item.result.toLowerCase()}`}
                  title={`${item.result} vs ${item.opponentName}`}
                >
                  {item.result}
                </span>
              ))}
            </div>

            <div className="grid" style={{ gap: "12px", marginTop: "16px" }}>
              {recentForm.map((match) => (
                <div
                  key={match.id}
                  className="mini-info-card"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="mini-info-title">
                    {match.homeTeamName} vs {match.awayTeamName}
                  </div>
                  <div className="mini-info-text">
                    Score: {match.homeScore ?? "-"} : {match.awayScore ?? "-"} •{" "}
                    {match.tournamentName}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}