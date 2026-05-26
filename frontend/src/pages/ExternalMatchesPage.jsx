import { useEffect, useState } from "react";
import TeamLogo from "../components/common/TeamLogo";
import { fetchJson } from "../api/client";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ExternalMatchesPage() {
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExternalMatches();
  }, [competitionCode]);

  async function loadExternalMatches() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(
        `/external/football/competitions/${competitionCode}/matches/simple`
      );
      setMatches(data);
    } catch {
      setError("Failed to load external matches.");
    } finally {
      setLoading(false);
    }
  }

  function getStatusClass(status) {
    if (status === "IN_PLAY") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  const competitionName =
    matches[0]?.competitionName ||
    COMPETITIONS.find((item) => item.code === competitionCode)?.label ||
    competitionCode;

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">External API</span>
        <h1 className="page-title">World Football Matches</h1>
        <p className="page-subtitle">
          Реальні матчі із football-data.org, підключені через зовнішній backend
          endpoint.
        </p>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={competitionCode}
          onChange={(event) => setCompetitionCode(event.target.value)}
        >
          {COMPETITIONS.map((competition) => (
            <option key={competition.code} value={competition.code}>
              {competition.label}
            </option>
          ))}
        </select>
      </div>

      <p className="results-count">Competition: {competitionName}</p>

      {loading ? <div className="loading-state">Loading external matches...</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        !matches.length ? (
          <div className="empty-state">No external matches found.</div>
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