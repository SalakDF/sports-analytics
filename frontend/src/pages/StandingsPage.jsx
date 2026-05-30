import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";
import { Link } from "react-router-dom";

export default function StandingsPage() {
  const [seasons, setSeasons] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState("ALL");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [standings, setStandings] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("position");
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

  useEffect(() => {
    if (!seasons.length) return;

    const filtered =
      selectedCompetition === "ALL"
        ? seasons
        : seasons.filter(
            (season) => season.tournamentName === selectedCompetition
          );

    if (!filtered.length) {
      setSelectedSeasonId("");
      return;
    }

    const currentStillExists = filtered.some(
      (season) => String(season.id) === String(selectedSeasonId)
    );

    if (!currentStillExists) {
      setSelectedSeasonId(String(filtered[0].id));
    }
  }, [selectedCompetition, seasons, selectedSeasonId]);

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

  function getGoalDifference(row) {
    if (typeof row.goalDifference === "number") return row.goalDifference;
    return (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0);
  }

  const competitionOptions = useMemo(() => {
    const names = seasons
      .map((season) => season.tournamentName)
      .filter(Boolean);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [seasons]);

  const filteredSeasons = useMemo(() => {
    if (selectedCompetition === "ALL") return seasons;

    return seasons.filter(
      (season) => season.tournamentName === selectedCompetition
    );
  }, [seasons, selectedCompetition]);

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  const filteredStandings = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    let items = standings.filter((row) =>
      !normalized ? true : row.teamName?.toLowerCase().includes(normalized)
    );

    items = [...items].sort((a, b) => {
      if (sortBy === "position") {
        return (a.position ?? 999) - (b.position ?? 999);
      }

      if (sortBy === "points") {
        return (b.points ?? 0) - (a.points ?? 0);
      }

      if (sortBy === "wins") {
        return (b.wins ?? 0) - (a.wins ?? 0);
      }

      if (sortBy === "gd") {
        return getGoalDifference(b) - getGoalDifference(a);
      }

      if (sortBy === "team") {
        return (a.teamName || "").localeCompare(b.teamName || "");
      }

      return 0;
    });

    return items;
  }, [standings, search, sortBy]);

  const leader = standings[0] || null;

  const bestAttack = useMemo(() => {
    if (!standings.length) return null;
    return standings.reduce((best, row) =>
      !best || (row.goalsFor ?? 0) > (best.goalsFor ?? 0) ? row : best
    , null);
  }, [standings]);

  const bestDefense = useMemo(() => {
    if (!standings.length) return null;
    return standings.reduce((best, row) =>
      !best || (row.goalsAgainst ?? 999) < (best.goalsAgainst ?? 999) ? row : best
    , null);
  }, [standings]);

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Table</span>
        <h1 className="page-title">Standings</h1>
        <p className="page-subtitle">
          Турнірна таблиця з табами ліг, вибором сезону, пошуком команд і сортуванням.
        </p>
      </div>

      <div className="league-tabs-wrap">
        <button
          type="button"
          className={`league-tab ${selectedCompetition === "ALL" ? "league-tab-active" : ""}`}
          onClick={() => setSelectedCompetition("ALL")}
        >
          All
        </button>

        {competitionOptions.map((competition) => (
          <button
            key={competition}
            type="button"
            className={`league-tab ${
              selectedCompetition === competition ? "league-tab-active" : ""
            }`}
            onClick={() => setSelectedCompetition(competition)}
          >
            {competition}
          </button>
        ))}
      </div>

      <div className="grid grid-3" style={{ marginBottom: "22px" }}>
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">League</span>
          </div>
          <div className="standings-summary-value">
            {selectedCompetition === "ALL" ? "All" : selectedCompetition}
          </div>
          <p className="card-muted">Поточний вибір турніру.</p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Leader</span>
          </div>
          <div className="standings-summary-value">
            {leader ? leader.teamName : "-"}
          </div>
          <p className="card-muted">
            {leader ? `${leader.points} pts after ${leader.played} matches` : "No data"}
          </p>
        </div>

        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="page-kicker">Clubs</span>
          </div>
          <div className="standings-summary-value">{filteredStandings.length}</div>
          <p className="card-muted">Команди у поточному списку.</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: "22px" }}>
        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Quick Insights
            </h2>
          </div>

          {!leader ? (
            <div className="empty-state">No insights available.</div>
          ) : (
            <div className="grid" style={{ gap: "12px" }}>
              <div className="insight-row">
                <div className="insight-label">Leader</div>
                <div className="insight-value-wrap">
                  <TeamLogo name={leader.teamName} logoUrl={leader.teamLogoUrl} size="sm" />
                  <div>
                    <div className="mini-info-title">{leader.teamName}</div>
                    <div className="mini-info-text">{leader.points} points</div>
                  </div>
                </div>
              </div>

              <div className="insight-row">
                <div className="insight-label">Best attack</div>
                <div className="insight-value-wrap">
                  <TeamLogo
                    name={bestAttack?.teamName}
                    logoUrl={bestAttack?.teamLogoUrl}
                    size="sm"
                  />
                  <div>
                    <div className="mini-info-title">{bestAttack?.teamName || "-"}</div>
                    <div className="mini-info-text">
                      {bestAttack?.goalsFor ?? 0} goals scored
                    </div>
                  </div>
                </div>
              </div>

              <div className="insight-row">
                <div className="insight-label">Best defense</div>
                <div className="insight-value-wrap">
                  <TeamLogo
                    name={bestDefense?.teamName}
                    logoUrl={bestDefense?.teamLogoUrl}
                    size="sm"
                  />
                  <div>
                    <div className="mini-info-title">{bestDefense?.teamName || "-"}</div>
                    <div className="mini-info-text">
                      {bestDefense?.goalsAgainst ?? 0} goals conceded
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Filters
            </h2>
          </div>

          <div className="standings-toolbar">
            <select
              className="filter-select"
              value={selectedSeasonId}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              disabled={seasonsLoading || !filteredSeasons.length}
            >
              {!filteredSeasons.length ? (
                <option value="">No seasons</option>
              ) : (
                filteredSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.tournamentName
                      ? `${season.tournamentName} • ${season.name}`
                      : season.name}
                  </option>
                ))
              )}
            </select>

            <input
              type="text"
              className="search-input"
              placeholder="Search team..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="filter-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="position">Sort by position</option>
              <option value="points">Sort by points</option>
              <option value="wins">Sort by wins</option>
              <option value="gd">Sort by goal difference</option>
              <option value="team">Sort by team A-Z</option>
            </select>
          </div>
        </div>
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
        !filteredStandings.length ? (
          <div className="empty-state">No standings found for this selection.</div>
        ) : (
          <div className="card standings-card-shell">
            <div className="section-header-row">
              <h2 className="section-title" style={{ margin: 0 }}>
                League Table
              </h2>
              <span className="results-count" style={{ margin: 0 }}>
                Rows: {filteredStandings.length}
              </span>
            </div>

            <div className="table-wrap standings-table-premium-wrap">
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
                  {filteredStandings.map((row, index) => (
                    <tr
                      key={row.id}
                      className={index < 3 ? "standings-row-highlight" : ""}
                    >
                      <td>
                        <span
                          className={
                            index === 0 && sortBy === "position"
                              ? "standings-position standings-position-first"
                              : "standings-position"
                          }
                        >
                          {row.position}
                        </span>
                      </td>

                      <td>
                        <Link
                          to={`/teams/${row.teamId}`}
                          className="standings-team-wrap"
                          style={{ textDecoration: "none" }}
                        >
                          <TeamLogo
                            name={row.teamName}
                            logoUrl={row.teamLogoUrl}
                            size="sm"
                          />
                          <span className="team-cell">{row.teamName}</span>
                        </Link>
                      </td>

                      <td>{row.played}</td>
                      <td>{row.wins}</td>
                      <td>{row.draws}</td>
                      <td>{row.losses}</td>
                      <td>{row.goalsFor}</td>
                      <td>{row.goalsAgainst}</td>
                      <td>{getGoalDifference(row)}</td>
                      <td className="points-cell">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}