import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";

export default function StandingsPage() {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) return;
    loadStandings(selectedSeasonId);
  }, [selectedSeasonId]);

  async function loadSeasons() {
    setSeasonsLoading(true);
    setError("");

    try {
      const data = await fetchJson("/seasons");
      setSeasons(data);

      if (data.length > 0) {
        setSelectedSeasonId(String(data[0].id));
      } else {
        setLoading(false);
      }
    } catch {
      setError("Failed to load seasons.");
      setLoading(false);
    } finally {
      setSeasonsLoading(false);
    }
  }

  async function loadStandings(seasonId) {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(`/standings?seasonId=${seasonId}`);
      setStandings(data);
    } catch {
      setError("Failed to load standings.");
    } finally {
      setLoading(false);
    }
  }

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Table</span>
        <h1 className="page-title">Standings</h1>
        <p className="page-subtitle">
          Турнірна таблиця з вибором сезону через backend API.
        </p>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={selectedSeasonId}
          onChange={(event) => setSelectedSeasonId(event.target.value)}
          disabled={seasonsLoading || !seasons.length}
        >
          {!seasons.length ? (
            <option value="">No seasons</option>
          ) : (
            seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.tournamentName
                  ? `${season.tournamentName} • ${season.name}`
                  : season.name}
              </option>
            ))
          )}
        </select>
      </div>

      {selectedSeason ? (
        <p className="results-count">
          Current season:{" "}
          {selectedSeason.tournamentName
            ? `${selectedSeason.tournamentName} • ${selectedSeason.name}`
            : selectedSeason.name}
        </p>
      ) : null}

      {loading ? <div className="loading-state">Loading standings...</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        !standings.length ? (
          <div className="empty-state">No standings found for this season.</div>
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
                {standings.map((row) => (
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