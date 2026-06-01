import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ExternalStandingsPage() {
  const { t } = useLanguage();
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadExternalStandings(); }, [competitionCode]);
  async function loadExternalStandings() {
    setLoading(true); setError("");
    try { setStandings(await fetchJson(`/external/football/competitions/${competitionCode}/standings/simple`)); }
    catch { setError(t("external.errorStandings", "Failed to load external standings.")); }
    finally { setLoading(false); }
  }

  const rows = standings?.rows || [];
  return (
    <div>
      <div className="page-header"><span className="page-kicker">{t("external.kicker", "External API")}</span><h1 className="page-title">{t("external.standingsTitle", "World Football Standings")}</h1></div>
      <div className="filters-bar">
        <select className="filter-select" value={competitionCode} onChange={(e) => setCompetitionCode(e.target.value)}>
          {COMPETITIONS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>
      {loading ? <div className="loading-state">{t("external.loadingStandings", "Loading external standings...")}</div> : null}
      {error ? <div className="error-state">{error}</div> : null}
      {!loading && !error ? (!rows.length ? <div className="empty-state">{t("external.noStandings", "No standings found.")}</div> : (
        <div className="table-wrap">
          <table className="standings-table"><thead><tr><th>#</th><th>{t("home.team", "Team")}</th><th>P</th><th>Pts</th></tr></thead><tbody>
            {rows.map((r) => <tr key={`${r.position}-${r.teamId}`}><td>{r.position}</td><td>{r.teamName}</td><td>{r.playedGames}</td><td className="points-cell">{r.points}</td></tr>)}
          </tbody></table>
        </div>
      )) : null}
    </div>
  );
}
