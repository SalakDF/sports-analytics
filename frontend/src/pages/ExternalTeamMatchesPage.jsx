import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import TeamLogo from "../components/common/TeamLogo";
import { fetchJson } from "../api/client";

export default function ExternalTeamMatchesPage() {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("name") || `Team ${teamId}`;

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTeamMatches();
  }, [teamId]);

  async function loadTeamMatches() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(`/external/football/teams/${teamId}/matches/simple`);
      setMatches(data);
    } catch {
      setError("Failed to load external team matches.");
    } finally {
      setLoading(false);
    }
  }

  function getStatusClass(status) {
    if (status === "IN_PLAY") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">External API</span>
        <h1 className="page-title">{teamName}</h1>
        <p className="page-subtitle">
          Останні матчі команди з зовнішнього football-data.org API.
        </p>
      </div>

      {loading ? <div className="loading-state">Loading external team matches...</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        !matches.length ? (
          <div className="empty-state">No matches found for this team.</div>
        ) : (
          <div className="grid grid-2">
            {matches.map((match) => (
              <div className="card" key={match.id}>
                <div className="match-card-header">
                  <div className="match-teams-stack">
                    <div className="team-inline">
                      <TeamLogo name={match.homeTeamName} size="sm" />
                      <div className="team-inline-text">
                        <div className="team-inline-name">{match.homeTeamName}</div>
                        <div className="team-inline-subtitle">Home</div>
                      </div>
                    </div>

                    <div className="team-inline">
                      <TeamLogo name={match.awayTeamName} size="sm" />
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
                  {match.competitionName || match.competitionCode}
                </p>

                <p className="card-muted">
                  {match.utcDate
                    ? new Date(match.utcDate).toLocaleString()
                    : "Date not available"}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}