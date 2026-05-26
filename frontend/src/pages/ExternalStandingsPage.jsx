import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TeamLogo from "../components/common/TeamLogo";
import { fetchJson } from "../api/client";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ExternalStandingsPage() {
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExternalStandings();
  }, [competitionCode]);

  async function loadExternalStandings() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(
        `/external/football/competitions/${competitionCode}/standings/simple`
      );
      setStandings(data);
    } catch {
      setError("Failed to load external standings.");
    } finally {
      setLoading(false);
    }
  }

  const rows = standings?.rows || [];

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">External API</span>
        <h1 className="page-title">World Football Standings</h1>
        <p className="page-subtitle">
          Реальні турнірні таблиці із football-data.org через зовнішній backend
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

      {standings ? (
        <p className="results-count">
          Competition: {standings.competitionName || standings.competitionCode}
        </p>
      ) : null}

      {loading ? (
        <div className="loading-state">Loading external standings...</div>
      ) : null}

      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        !rows.length ? (
          <div className="empty-state">No standings found.</div>
        ) : (
          <div className="table-wrap">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.position}-${row.teamId}`}>
                    <td>{row.position}</td>
                    <td>
                      <Link
                        to={`/external-teams/${row.teamId}/matches?name=${encodeURIComponent(
                          row.teamName
                        )}`}
                        className="standings-team-wrap"
                        style={{ textDecoration: "none" }}
                      >
                        <TeamLogo name={row.teamName} size="sm" />
                        <span className="team-cell">{row.teamName}</span>
                      </Link>
                    </td>
                    <td>{row.playedGames}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.goalsFor}</td>
                    <td>{row.goalsAgainst}</td>
                    <td className="points-cell">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}