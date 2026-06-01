import { useEffect, useMemo, useState } from "react";
import { fetchJson, postJson, postRequest } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ExternalSyncPage() {
  const { t } = useLanguage();
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [seasons, setSeasons] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [competitionMappings, setCompetitionMappings] = useState([]);
  const [manualSeasonId, setManualSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [fullSyncLoading, setFullSyncLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [seasonsData, mappingsData, competitionMappingsData] = await Promise.all([
        fetchJson("/seasons"),
        fetchJson("/external/football/team-mappings"),
        fetchJson("/external/football/competition-mappings"),
      ]);
      setSeasons(seasonsData);
      setMappings(mappingsData);
      setCompetitionMappings(competitionMappingsData);
      if (seasonsData.length > 0) setManualSeasonId(String(seasonsData[0].id));
    } catch {
      setError(t("external.errorSyncData", "Failed to load sync data."));
    } finally { setLoading(false); }
  }

  const selectedCompetitionMapping = useMemo(
    () => competitionMappings.find((item) => String(item.externalCompetitionCode) === String(competitionCode)),
    [competitionMappings, competitionCode]
  );

  const selectedSeason = useMemo(() => {
    const resolvedSeasonId = selectedCompetitionMapping?.internalSeasonId || manualSeasonId;
    return seasons.find((item) => String(item.id) === String(resolvedSeasonId));
  }, [seasons, manualSeasonId, selectedCompetitionMapping]);

  async function handleSync() {
    setSyncLoading(true); setError(""); setMessage("");
    try {
      const payload = { competitionCode };
      if (!selectedCompetitionMapping && manualSeasonId) payload.seasonId = Number(manualSeasonId);
      const result = await postJson("/external/football/sync-matches", payload);
      setMessage(`${t("external.syncDone", "Sync completed")}. ${t("external.refreshed", "refreshed")}: ${result.refreshedExternalCount}, ${t("external.created", "created")}: ${result.createdInternalCount}, ${t("external.updated", "updated")}: ${result.updatedInternalCount}, ${t("external.skipped", "skipped")}: ${result.skippedCount}.`);
    } catch {
      setError(t("external.errorSync", "Failed to sync external matches."));
    } finally { setSyncLoading(false); }
  }

  async function handleFullSync() {
    setFullSyncLoading(true); setError(""); setMessage("");
    try {
      const importTeamsResult = await postRequest(`/external/football/competitions/${competitionCode}/import-teams`);
      const autoMapResult = await postRequest(`/external/football/team-mappings/auto?competitionCode=${competitionCode}`);
      const payload = { competitionCode };
      if (!selectedCompetitionMapping && manualSeasonId) payload.seasonId = Number(manualSeasonId);
      const syncResult = await postJson("/external/football/sync-matches", payload);
      setMessage(`${t("external.fullSyncDone", "Full sync completed")}. ${t("external.createdTeams", "Created teams")}: ${importTeamsResult.createdTeams}. ${t("external.mapped", "Mapped")}: ${autoMapResult.mappedCount}. ${t("external.createdMatches", "Created matches")}: ${syncResult.createdInternalCount}, ${t("external.updatedMatches", "updated")}: ${syncResult.updatedInternalCount}.`);
      await loadData();
    } catch {
      setError(t("external.errorFullSync", "Failed to run full sync pipeline."));
    } finally { setFullSyncLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">{t("external.realSync", "Real Sync")}</span>
        <h1 className="page-title">{t("external.syncTitle", "External Match Sync")}</h1>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "22px" }}>
        <div className="card"><h3 className="card-title">{t("external.mappedTeams", "Mapped teams")}</h3><div className="hero-panel-value" style={{ fontSize: "30px", marginBottom: 0 }}>{mappings.length}</div></div>
        <div className="card"><h3 className="card-title">{t("external.competitionMapping", "Competition mapping")}</h3><div className="hero-panel-value" style={{ fontSize: "24px", marginBottom: 0 }}>{selectedCompetitionMapping ? t("external.mapped", "Mapped") : t("external.manual", "Manual")}</div></div>
        <div className="card"><h3 className="card-title">{t("external.targetSeason", "Target season")}</h3><div className="hero-panel-value" style={{ fontSize: "20px", marginBottom: 0 }}>{selectedSeason ? (selectedSeason.tournamentName ? `${selectedSeason.tournamentName} • ${selectedSeason.name}` : selectedSeason.name) : "-"}</div></div>
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={competitionCode} onChange={(event) => setCompetitionCode(event.target.value)}>
          {COMPETITIONS.map((competition) => <option key={competition.code} value={competition.code}>{competition.label}</option>)}
        </select>

        <select className="filter-select" value={selectedCompetitionMapping ? String(selectedCompetitionMapping.internalSeasonId) : manualSeasonId} onChange={(event) => setManualSeasonId(event.target.value)} disabled={Boolean(selectedCompetitionMapping)}>
          {!seasons.length ? <option value="">{t("standings.noSeasons", "No seasons")}</option> : seasons.map((season) => <option key={season.id} value={season.id}>{season.tournamentName ? `${season.tournamentName} • ${season.name}` : season.name}</option>)}
        </select>

        <button type="button" className="hero-button hero-button-secondary" onClick={handleSync} disabled={syncLoading || loading || fullSyncLoading}>{syncLoading ? t("external.syncing", "Syncing...") : t("external.importAndSync", "Import + Sync")}</button>
        <button type="button" className="hero-button hero-button-primary" onClick={handleFullSync} disabled={fullSyncLoading || loading || syncLoading}>{fullSyncLoading ? t("external.runningFullSync", "Running full sync...") : t("external.fullSyncPipeline", "Full sync pipeline")}</button>
      </div>

      <div className="loading-state" style={{ marginTop: "18px" }}>{selectedCompetitionMapping ? `${t("external.autoMappingActive", "Auto mapping active")}: ${selectedCompetitionMapping.externalCompetitionName} -> ${selectedCompetitionMapping.internalSeasonName}` : t("external.noCompetitionMapping", "No competition mapping found. Manual season selection will be used.")}</div>

      {loading ? <div className="loading-state">{t("external.loadingSyncPage", "Loading sync page...")}</div> : null}
      {message ? <div className="loading-state" style={{ marginTop: "18px" }}>{message}</div> : null}
      {error ? <div className="error-state" style={{ marginTop: "18px" }}>{error}</div> : null}
    </div>
  );
}
