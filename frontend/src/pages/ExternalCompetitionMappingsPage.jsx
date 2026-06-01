import { useEffect, useMemo, useState } from "react";
import { fetchJson, postJson } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const COMPETITIONS = [
  { code: "PL", name: "Premier League" },
  { code: "BL1", name: "Bundesliga" },
  { code: "PD", name: "La Liga" },
  { code: "SA", name: "Serie A" },
  { code: "CL", name: "Champions League" },
];

export default function ExternalCompetitionMappingsPage() {
  const { t } = useLanguage();
  const [seasons, setSeasons] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoadingCode, setSaveLoadingCode] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { loadPageData(); }, []);

  async function loadPageData() {
    setLoading(true); setError(""); setMessage("");
    try {
      const [seasonsData, mappingsData] = await Promise.all([
        fetchJson("/seasons"),
        fetchJson("/external/football/competition-mappings"),
      ]);
      setSeasons(seasonsData);
      setMappings(mappingsData);
      const initialDrafts = {};
      for (const mapping of mappingsData) initialDrafts[mapping.externalCompetitionCode] = String(mapping.internalSeasonId);
      setDrafts(initialDrafts);
    } catch {
      setError(t("external.errorCompetitionMappings", "Failed to load competition mapping data."));
    } finally { setLoading(false); }
  }

  function handleDraftChange(code, value) {
    setDrafts((prev) => ({ ...prev, [code]: value }));
  }

  async function handleSave(competition) {
    const selectedSeasonId = drafts[competition.code];
    if (!selectedSeasonId) {
      setError(t("external.selectSeasonFirst", "Please select an internal season first."));
      return;
    }

    setSaveLoadingCode(competition.code); setError(""); setMessage("");
    try {
      const saved = await postJson("/external/football/competition-mappings", {
        externalCompetitionCode: competition.code,
        externalCompetitionName: competition.name,
        internalSeasonId: Number(selectedSeasonId),
      });

      setMappings((prev) => {
        const filtered = prev.filter((item) => String(item.externalCompetitionCode) !== String(saved.externalCompetitionCode));
        return [...filtered, saved];
      });
      setMessage(`${t("external.savedMapping", "Saved mapping")}: ${saved.externalCompetitionName} -> ${saved.internalSeasonName}`);
    } catch {
      setError(t("external.errorSaveCompetitionMapping", "Failed to save competition mapping."));
    } finally { setSaveLoadingCode(null); }
  }

  const mappingMap = useMemo(() => {
    const map = {};
    for (const item of mappings) map[item.externalCompetitionCode] = item;
    return map;
  }, [mappings]);

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">{t("external.syncPreparation", "Sync Preparation")}</span>
        <h1 className="page-title">{t("external.competitionMappingTitle", "External Competition Mapping")}</h1>
        <p className="page-subtitle">{t("external.competitionMappingSubtitle", "Map external competitions to internal seasons for correct sync target.")}</p>
      </div>

      {message ? <div className="loading-state" style={{ marginBottom: "18px" }}>{message}</div> : null}
      {loading ? <div className="loading-state">{t("external.loadingCompetitionMappings", "Loading competition mappings...")}</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        <div className="grid" style={{ gap: "14px" }}>
          {COMPETITIONS.map((competition) => {
            const existingMapping = mappingMap[competition.code];
            return (
              <div className="card" key={competition.code}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr auto", gap: "14px", alignItems: "center" }}>
                  <div>
                    <div className="team-inline-name">{competition.name}</div>
                    <div className="team-inline-subtitle">{t("external.externalCode", "External code")}: {competition.code}</div>
                  </div>

                  <div>
                    <select className="filter-select" value={drafts[competition.code] || ""} onChange={(event) => handleDraftChange(competition.code, event.target.value)} style={{ width: "100%" }}>
                      <option value="">{t("external.selectInternalSeason", "Select internal season")}</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.tournamentName ? `${season.tournamentName} • ${season.name}` : season.name}
                        </option>
                      ))}
                    </select>
                    {existingMapping ? <div className="team-inline-subtitle" style={{ marginTop: "8px" }}>{t("external.current", "Current")}: {existingMapping.internalSeasonName}</div> : null}
                  </div>

                  <button type="button" className="hero-button hero-button-primary" onClick={() => handleSave(competition)} disabled={saveLoadingCode === competition.code}>
                    {saveLoadingCode === competition.code ? t("common.loading", "Loading...") : t("external.save", "Save")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
