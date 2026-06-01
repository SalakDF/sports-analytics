import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchJson } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export default function ExternalTeamMatchesPage() {
  const { t } = useLanguage();
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("name") || `Team ${teamId}`;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadTeamMatches(); }, [teamId]);
  async function loadTeamMatches() {
    setLoading(true); setError("");
    try { setMatches(await fetchJson(`/external/football/teams/${teamId}/matches/simple`)); }
    catch { setError(t("external.errorTeamMatches", "Failed to load external team matches.")); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header"><span className="page-kicker">{t("external.kicker", "External API")}</span><h1 className="page-title">{teamName}</h1></div>
      {loading ? <div className="loading-state">{t("external.loadingTeamMatches", "Loading external team matches...")}</div> : null}
      {error ? <div className="error-state">{error}</div> : null}
      {!loading && !error ? (!matches.length ? <div className="empty-state">{t("external.noTeamMatches", "No matches found for this team.")}</div> : (
        <div className="grid grid-2">{matches.map((m) => <div className="card" key={m.id}><div className="mini-info-title">{m.homeTeamName} vs {m.awayTeamName}</div><div className="mini-info-text">{m.homeScore ?? "-"} : {m.awayScore ?? "-"}</div></div>)}</div>
      )) : null}
    </div>
  );
}
