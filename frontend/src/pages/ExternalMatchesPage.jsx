import { useEffect, useState } from "react";
import TeamLogo from "../components/common/TeamLogo";
import { fetchJson } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ExternalMatchesPage() {
  const { t } = useLanguage();
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadExternalMatches(); }, [competitionCode]);
  async function loadExternalMatches() {
    setLoading(true); setError("");
    try { setMatches(await fetchJson(`/external/football/competitions/${competitionCode}/matches/simple`)); }
    catch { setError(t("external.errorMatches", "Failed to load external matches.")); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header"><span className="page-kicker">{t("external.kicker", "External API")}</span><h1 className="page-title">{t("external.matchesTitle", "World Football Matches")}</h1></div>
      <div className="filters-bar">
        <select className="filter-select" value={competitionCode} onChange={(e) => setCompetitionCode(e.target.value)}>
          {COMPETITIONS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>
      {loading ? <div className="loading-state">{t("external.loadingMatches", "Loading external matches...")}</div> : null}
      {error ? <div className="error-state">{error}</div> : null}
      {!loading && !error ? (!matches.length ? <div className="empty-state">{t("external.noMatches", "No external matches found.")}</div> : (
        <div className="grid grid-2">
          {matches.map((m) => (
            <div className="card" key={m.id}>
              <div className="match-card-header">
                <div className="match-teams-stack">
                  <div className="team-inline"><TeamLogo name={m.homeTeamName} size="sm" /><div className="team-inline-text"><div className="team-inline-name">{m.homeTeamName}</div></div></div>
                  <div className="team-inline"><TeamLogo name={m.awayTeamName} size="sm" /><div className="team-inline-text"><div className="team-inline-name">{m.awayTeamName}</div></div></div>
                </div>
                <div className="score-value" style={{ fontSize: "28px" }}>{m.homeScore ?? "-"} : {m.awayScore ?? "-"}</div>
              </div>
            </div>
          ))}
        </div>
      )) : null}
    </div>
  );
}
