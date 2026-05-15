import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchJson } from "../api/client";

export default function MatchDetailsPage() {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson(`/matches/${id}`)
      .then((data) => setMatch(data))
      .catch(() => setError("Failed to load match details"))
      .finally(() => setLoading(false));
  }, [id]);

  const getStatusClass = (status) => {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  };

  if (loading) return <div className="loading-state">Loading match details...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!match) return <div className="empty-state">Match not found.</div>;

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Match Center</span>
        <h1 className="page-title">
          {match.homeTeamName} vs {match.awayTeamName}
        </h1>
        <p className="page-subtitle">
          Детальна сторінка матчу з основною інформацією про команди, рахунок,
          статус гри та турнір.
        </p>
      </div>

      <div className="hero-card">
        <div className="match-scoreboard">
          <div className="team-panel">
            <div className="team-name">{match.homeTeamName}</div>
            <div className="team-meta">Home Team</div>
          </div>

          <div className="score-panel">
            <div className="score-value">
              {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
            </div>

            <div className="meta-row" style={{ justifyContent: "center" }}>
              <span className={getStatusClass(match.status)}>{match.status}</span>
            </div>
          </div>

          <div className="team-panel">
            <div className="team-name">{match.awayTeamName}</div>
            <div className="team-meta">Away Team</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card">
          <h2 className="section-title">Match Info</h2>

          <p className="card-muted">
            <strong>Tournament:</strong> {match.tournamentName || "-"}
          </p>
          <p className="card-muted">
            <strong>Season:</strong> {match.seasonName || "-"}
          </p>
          <p className="card-muted">
            <strong>Round:</strong> {match.roundName || "-"}
          </p>
          <p className="card-muted">
            <strong>Venue:</strong> {match.venue || "-"}
          </p>
          <p className="card-muted">
            <strong>Date:</strong>{" "}
            {match.scheduledAt
              ? new Date(match.scheduledAt).toLocaleString()
              : "-"}
          </p>
        </div>

        <div className="card">
          <h2 className="section-title">Quick Navigation</h2>

          <p className="card-muted">
            Тут пізніше можна буде додати розширену статистику матчу, події гри,
            форму команд і кнопку додавання в обране.
          </p>

          <div className="meta-row">
            <Link className="action-link" to="/matches">
              ← Back to matches
            </Link>
            <Link className="action-link" to={`/teams/${match.homeTeamId}`}>
              Home team →
            </Link>
            <Link className="action-link" to={`/teams/${match.awayTeamId}`}>
              Away team →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}