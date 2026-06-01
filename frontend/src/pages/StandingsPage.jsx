import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

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
  const { t } = useLanguage();

  useEffect(() => { loadSeasons(); }, []);
  useEffect(() => { if (selectedSeasonId) loadStandings(selectedSeasonId); }, [selectedSeasonId]);

  useEffect(() => {
    if (!seasons.length) return;
    const filtered = selectedCompetition === "ALL" ? seasons : seasons.filter((s) => s.tournamentName === selectedCompetition);
    if (!filtered.length) return setSelectedSeasonId("");
    if (!filtered.some((s) => String(s.id) === String(selectedSeasonId))) setSelectedSeasonId(String(filtered[0].id));
  }, [selectedCompetition, seasons, selectedSeasonId]);

  async function loadSeasons() {
    setSeasonsLoading(true);
    setError("");
    try {
      const data = await fetchJson("/seasons");
      setSeasons(data);
      if (data.length) setSelectedSeasonId(String(data[0].id));
      else setLoading(false);
    } catch {
      setError(t("standings.errorSeasons", "Failed to load seasons."));
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
      setError(t("standings.errorStandings", "Failed to load standings."));
    } finally {
      setLoading(false);
    }
  }

  const competitionOptions = useMemo(() => [...new Set(seasons.map((s) => s.tournamentName).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [seasons]);
  const filteredSeasons = useMemo(() => selectedCompetition === "ALL" ? seasons : seasons.filter((s) => s.tournamentName === selectedCompetition), [seasons, selectedCompetition]);
  const selectedSeason = seasons.find((s) => String(s.id) === String(selectedSeasonId));

  const filteredStandings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = standings.filter((r) => !q || r.teamName?.toLowerCase().includes(q));
    return [...items].sort((a, b) => {
      if (sortBy === "position") return (a.position ?? 999) - (b.position ?? 999);
      if (sortBy === "points") return (b.points ?? 0) - (a.points ?? 0);
      if (sortBy === "wins") return (b.wins ?? 0) - (a.wins ?? 0);
      if (sortBy === "team") return (a.teamName || "").localeCompare(b.teamName || "");
      const gdA = (a.goalDifference ?? ((a.goalsFor ?? 0) - (a.goalsAgainst ?? 0)));
      const gdB = (b.goalDifference ?? ((b.goalsFor ?? 0) - (b.goalsAgainst ?? 0)));
      return gdB - gdA;
    });
  }, [standings, search, sortBy]);

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">{t("header.standings", "Standings")}</span>
        <h1 className="page-title">{t("header.standings", "Standings")}</h1>
      </div>

      <div className="league-tabs-wrap">
        <button type="button" className={`league-tab ${selectedCompetition === "ALL" ? "league-tab-active" : ""}`} onClick={() => setSelectedCompetition("ALL")}>{t("common.all", "All")}</button>
        {competitionOptions.map((competition) => (
          <button key={competition} type="button" className={`league-tab ${selectedCompetition === competition ? "league-tab-active" : ""}`} onClick={() => setSelectedCompetition(competition)}>{competition}</button>
        ))}
      </div>

      <div className="standings-toolbar" style={{ marginBottom: "16px" }}>
        <select className="filter-select" value={selectedSeasonId} onChange={(e) => setSelectedSeasonId(e.target.value)} disabled={seasonsLoading || !filteredSeasons.length}>
          {!filteredSeasons.length ? <option value="">{t("standings.noSeasons", "No seasons")}</option> : filteredSeasons.map((s) => <option key={s.id} value={s.id}>{s.tournamentName ? `${s.tournamentName} • ${s.name}` : s.name}</option>)}
        </select>
        <input type="text" className="search-input" placeholder={t("standings.searchTeam", "Search team...")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="position">{t("standings.sortPosition", "Sort by position")}</option>
          <option value="points">{t("standings.sortPoints", "Sort by points")}</option>
          <option value="wins">{t("standings.sortWins", "Sort by wins")}</option>
          <option value="gd">{t("standings.sortGd", "Sort by goal difference")}</option>
          <option value="team">{t("standings.sortTeam", "Sort by team A-Z")}</option>
        </select>
      </div>

      {selectedSeason ? <p className="results-count">{t("home.season", "Season")}: {selectedSeason.tournamentName ? `${selectedSeason.tournamentName} • ${selectedSeason.name}` : selectedSeason.name}</p> : null}
      {loading ? <div className="loading-state">{t("standings.loading", "Loading standings...")}</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (!filteredStandings.length ? (
        <div className="empty-state">{t("standings.empty", "No standings found for this selection.")}</div>
      ) : (
        <div className="card standings-card-shell">
          <div className="section-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>{t("standings.table", "League Table")}</h2>
            <span className="results-count" style={{ margin: 0 }}>{t("standings.rows", "Rows")}: {filteredStandings.length}</span>
          </div>
          <div className="table-wrap standings-table-premium-wrap">
            <table className="standings-table">
              <thead>
                <tr><th>#</th><th>{t("home.team", "Team")}</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {filteredStandings.map((row) => (
                  <tr key={row.id}>
                    <td>{row.position}</td>
                    <td>
                      <Link to={`/teams/${row.teamId}`} className="standings-team-wrap" style={{ textDecoration: "none" }}>
                        <TeamLogo name={row.teamName} logoUrl={row.teamLogoUrl} size="sm" />
                        <span className="team-cell">{row.teamName}</span>
                      </Link>
                    </td>
                    <td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalDifference ?? ((row.goalsFor ?? 0) - (row.goalsAgainst ?? 0))}</td><td className="points-cell">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )) : null}
    </div>
  );
}
