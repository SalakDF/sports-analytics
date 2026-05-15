import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

export default function StandingsPage() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson("/standings?seasonId=1")
      .then((data) => setStandings(data))
      .catch(() => setError("Failed to load standings"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading standings...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!standings.length) return <div className="empty-state">No standings found.</div>;

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Table</span>
        <h1 className="page-title">Standings</h1>
        <p className="page-subtitle">
          Турнірна таблиця сезону з основними статистичними показниками команд.
        </p>
      </div>

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
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>

          <tbody>
            {standings.map((row) => (
              <tr key={row.id}>
                <td>{row.position}</td>
                <td className="team-cell">{row.teamName}</td>
                <td>{row.played}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{row.goalDifference}</td>
                <td className="points-cell">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}