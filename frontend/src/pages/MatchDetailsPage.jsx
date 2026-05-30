import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";

export default function MatchDetailsPage() {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [homeRecentMatches, setHomeRecentMatches] = useState([]);
  const [awayRecentMatches, setAwayRecentMatches] = useState([]);
  const [headToHeadMatches, setHeadToHeadMatches] = useState([]);
  const [homeStats, setHomeStats] = useState(null);
  const [awayStats, setAwayStats] = useState(null);
  const [recentLoading, setRecentLoading] = useState(true);
  const [headToHeadLoading, setHeadToHeadLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteError, setFavoriteError] = useState("");

  useEffect(() => {
    fetchJson(`/matches/${id}`)
      .then((data) => setMatch(data))
      .catch(() => setError("Failed to load match details."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!match?.homeTeamId || !match?.awayTeamId) return;

    setRecentLoading(true);
    setHeadToHeadLoading(true);
    setStatsLoading(true);

    Promise.all([
      fetchJson(`/teams/${match.homeTeamId}/recent-matches`).catch(() => []),
      fetchJson(`/teams/${match.awayTeamId}/recent-matches`).catch(() => []),
      fetchJson(`/matches/${id}/head-to-head`).catch(() => []),
      fetchJson(`/teams/${match.homeTeamId}/stats`).catch(() => null),
      fetchJson(`/teams/${match.awayTeamId}/stats`).catch(() => null),
    ])
      .then(([homeData, awayData, h2hData, homeStatsData, awayStatsData]) => {
        setHomeRecentMatches(homeData);
        setAwayRecentMatches(awayData);
        setHeadToHeadMatches(h2hData);
        setHomeStats(homeStatsData);
        setAwayStats(awayStatsData);
      })
      .finally(() => {
        setRecentLoading(false);
        setHeadToHeadLoading(false);
        setStatsLoading(false);
      });
  }, [id, match?.homeTeamId, match?.awayTeamId]);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user?.id) {
      setIsFavorite(false);
      return;
    }

    fetchJson(`/favorites/matches?userId=${user.id}`)
      .then((favorites) => {
        const exists = favorites.some(
          (favoriteMatch) => String(favoriteMatch.matchId) === String(id)
        );
        setIsFavorite(exists);
      })
      .catch(() => setIsFavorite(false));
  }, [id]);

  function getStatusClass(status) {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

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
      await apiRequest(`/favorites/matches?userId=${user.id}&matchId=${id}`, {
        method: isFavorite ? "DELETE" : "POST",
      });

      if (isFavorite) {
        setIsFavorite(false);
        setFavoriteMessage("Match removed from favorites.");
      } else {
        setIsFavorite(true);
        setFavoriteMessage("Match added to favorites.");
      }
    } catch {
      setFavoriteError("Failed to update favorite match.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  function buildRecentForm(matches, teamId) {
    return matches.slice(0, 5).map((item) => {
      const isHome = String(item.homeTeamId) === String(teamId);
      const teamScore = isHome ? item.homeScore : item.awayScore;
      const opponentScore = isHome ? item.awayScore : item.homeScore;

      let result = "D";
      if (teamScore > opponentScore) result = "W";
      if (teamScore < opponentScore) result = "L";

      return {
        ...item,
        result,
        opponentName: isHome ? item.awayTeamName : item.homeTeamName,
      };
    });
  }

  const homeForm = useMemo(
    () => buildRecentForm(homeRecentMatches, match?.homeTeamId),
    [homeRecentMatches, match?.homeTeamId]
  );

  const awayForm = useMemo(
    () => buildRecentForm(awayRecentMatches, match?.awayTeamId),
    [awayRecentMatches, match?.awayTeamId]
  );

  const headToHeadSummary = useMemo(() => {
    if (!match) return { homeWins: 0, awayWins: 0, draws: 0 };

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    for (const item of headToHeadMatches) {
      const homeTeamIsCurrentHome =
        String(item.homeTeamId) === String(match.homeTeamId);

      const currentHomeScore = homeTeamIsCurrentHome
        ? item.homeScore
        : item.awayScore;

      const currentAwayScore = homeTeamIsCurrentHome
        ? item.awayScore
        : item.homeScore;

      if (currentHomeScore > currentAwayScore) homeWins++;
      else if (currentHomeScore < currentAwayScore) awayWins++;
      else draws++;
    }

    return { homeWins, awayWins, draws };
  }, [headToHeadMatches, match]);

  const insightText = useMemo(() => {
    if (!homeStats || !awayStats || !match) return "Comparison is not available yet.";

    const homePower =
      (homeStats.winRate || 0) +
      (homeStats.averageGoalsFor || 0) * 10 +
      (homeStats.goalDifference || 0);

    const awayPower =
      (awayStats.winRate || 0) +
      (awayStats.averageGoalsFor || 0) * 10 +
      (awayStats.goalDifference || 0);

    const diff = homePower - awayPower;

    if (Math.abs(diff) < 5) {
      return `The matchup between ${match.homeTeamName} and ${match.awayTeamName} looks balanced based on current internal team stats.`;
    }

    if (diff > 0) {
      return `${match.homeTeamName} has a slight statistical edge by win rate, scoring profile and goal difference.`;
    }

    return `${match.awayTeamName} has a slight statistical edge by win rate, scoring profile and goal difference.`;
  }, [homeStats, awayStats, match]);

  if (loading) return <div className="loading-state">Loading match details...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!match) return <div className="empty-state">Match not found.</div>;

  return (
    <div>
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-top-row">
            <span className="page-kicker">Match Center</span>

            <div className="meta-row">
              <span className={getStatusClass(match.status)}>{match.status}</span>
              <span className="badge">{match.roundName || "Round -"}</span>
              <span className="badge">{match.venue || "Venue -"}</span>
            </div>
          </div>

          <div className="match-detail-scoreboard">
            <div className="match-detail-team">
              <TeamLogo
                name={match.homeTeamName}
                logoUrl={match.homeTeamLogoUrl}
                size="lg"
              />
              <div className="match-detail-team-name">{match.homeTeamName}</div>
              <div className="team-inline-subtitle">Home Team</div>
            </div>

            <div className="match-detail-center">
              <div className="match-detail-score">
                {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
              </div>
              <div className="detail-subtitle" style={{ textAlign: "center" }}>
                {match.scheduledAt
                  ? new Date(match.scheduledAt).toLocaleString()
                  : "Date not available"}
              </div>
            </div>

            <div className="match-detail-team">
              <TeamLogo
                name={match.awayTeamName}
                logoUrl={match.awayTeamLogoUrl}
                size="lg"
              />
              <div className="match-detail-team-name">{match.awayTeamName}</div>
              <div className="team-inline-subtitle">Away Team</div>
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

            <Link to="/matches" className="hero-button hero-button-secondary">
              Back to matches
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
          <h2 className="section-title">Match Info</h2>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Tournament</span>
              <span className="detail-info-value">{match.tournamentName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Season</span>
              <span className="detail-info-value">{match.seasonName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Round</span>
              <span className="detail-info-value">{match.roundName || "-"}</span>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-label">Venue</span>
              <span className="detail-info-value">{match.venue || "-"}</span>
            </div>
          </div>
        </div>

        <div className="card detail-card">
          <h2 className="section-title">Quick Navigation</h2>

          <p className="detail-paragraph">{insightText}</p>

          <div className="detail-links-column">
            <Link className="action-link" to={`/teams/${match.homeTeamId}`}>
              Open home team →
            </Link>
            <Link className="action-link" to={`/teams/${match.awayTeamId}`}>
              Open away team →
            </Link>
            <Link className="action-link" to="/matches">
              ← Back to matches
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: "22px" }}>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{match.homeTeamName}</span>
          </div>
          <div className="standings-summary-value">{headToHeadSummary.homeWins}</div>
          <p className="card-muted">Wins in recent head-to-head meetings.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Draws</span>
          </div>
          <div className="standings-summary-value">{headToHeadSummary.draws}</div>
          <p className="card-muted">Draw results in recent head-to-head meetings.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">{match.awayTeamName}</span>
          </div>
          <div className="standings-summary-value">{headToHeadSummary.awayWins}</div>
          <p className="card-muted">Wins in recent head-to-head meetings.</p>
        </div>
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">Team Comparison</h2>

        {statsLoading ? (
          <div className="loading-state">Loading comparison stats...</div>
        ) : !homeStats || !awayStats ? (
          <div className="empty-state">Comparison stats are not available.</div>
        ) : (
          <div className="comparison-grid">
            <div className="comparison-stat-card">
              <span className="detail-info-label">Win rate</span>
              <div className="comparison-line">
                <strong>{homeStats.winRate}%</strong>
                <span>vs</span>
                <strong>{awayStats.winRate}%</strong>
              </div>
            </div>

            <div className="comparison-stat-card">
              <span className="detail-info-label">Avg goals scored</span>
              <div className="comparison-line">
                <strong>{homeStats.averageGoalsFor}</strong>
                <span>vs</span>
                <strong>{awayStats.averageGoalsFor}</strong>
              </div>
            </div>

            <div className="comparison-stat-card">
              <span className="detail-info-label">Goal difference</span>
              <div className="comparison-line">
                <strong>{homeStats.goalDifference}</strong>
                <span>vs</span>
                <strong>{awayStats.goalDifference}</strong>
              </div>
            </div>

            <div className="comparison-stat-card">
              <span className="detail-info-label">Clean sheets</span>
              <div className="comparison-line">
                <strong>{homeStats.cleanSheets}</strong>
                <span>vs</span>
                <strong>{awayStats.cleanSheets}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">Head-to-Head</h2>

        {headToHeadLoading ? (
          <div className="loading-state">Loading head-to-head...</div>
        ) : !headToHeadMatches.length ? (
          <div className="empty-state">No previous meetings found.</div>
        ) : (
          <div className="grid" style={{ gap: "12px" }}>
            {headToHeadMatches.map((item) => (
              <div
                key={item.id}
                className="mini-info-card"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="mini-info-title">
                  {item.homeTeamName} vs {item.awayTeamName}
                </div>
                <div className="mini-info-text">
                  Score: {item.homeScore ?? "-"} : {item.awayScore ?? "-"} •{" "}
                  {item.tournamentName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card detail-card">
          <h2 className="section-title">Home Team Form</h2>

          {recentLoading ? (
            <div className="loading-state">Loading recent form...</div>
          ) : !homeForm.length ? (
            <div className="empty-state">No recent matches found.</div>
          ) : (
            <>
              <div className="form-badges-row">
                {homeForm.map((item) => (
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
                {homeForm.map((item) => (
                  <div
                    key={item.id}
                    className="mini-info-card"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="mini-info-title">
                      {item.homeTeamName} vs {item.awayTeamName}
                    </div>
                    <div className="mini-info-text">
                      Score: {item.homeScore ?? "-"} : {item.awayScore ?? "-"} •{" "}
                      {item.tournamentName}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card detail-card">
          <h2 className="section-title">Away Team Form</h2>

          {recentLoading ? (
            <div className="loading-state">Loading recent form...</div>
          ) : !awayForm.length ? (
            <div className="empty-state">No recent matches found.</div>
          ) : (
            <>
              <div className="form-badges-row">
                {awayForm.map((item) => (
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
                {awayForm.map((item) => (
                  <div
                    key={item.id}
                    className="mini-info-card"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="mini-info-title">
                      {item.homeTeamName} vs {item.awayTeamName}
                    </div>
                    <div className="mini-info-text">
                      Score: {item.homeScore ?? "-"} : {item.awayScore ?? "-"} •{" "}
                      {item.tournamentName}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}