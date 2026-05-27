import { useEffect, useMemo, useState } from "react";
import { fetchJson, postJson } from "../api/client";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ExternalSyncPage() {
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [seasons, setSeasons] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [competitionMappings, setCompetitionMappings] = useState([]);
  const [manualSeasonId, setManualSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [seasonsData, mappingsData, competitionMappingsData] =
        await Promise.all([
          fetchJson("/seasons"),
          fetchJson("/external/football/team-mappings"),
          fetchJson("/external/football/competition-mappings"),
        ]);

      setSeasons(seasonsData);
      setMappings(mappingsData);
      setCompetitionMappings(competitionMappingsData);

      if (seasonsData.length > 0) {
        setManualSeasonId(String(seasonsData[0].id));
      }
    } catch {
      setError("Failed to load sync data.");
    } finally {
      setLoading(false);
    }
  }

  const selectedCompetitionMapping = useMemo(() => {
    return competitionMappings.find(
      (item) =>
        String(item.externalCompetitionCode) === String(competitionCode)
    );
  }, [competitionMappings, competitionCode]);

  const selectedSeason = useMemo(() => {
    const resolvedSeasonId =
      selectedCompetitionMapping?.internalSeasonId || manualSeasonId;

    return seasons.find(
      (item) => String(item.id) === String(resolvedSeasonId)
    );
  }, [seasons, manualSeasonId, selectedCompetitionMapping]);

  async function handleSync() {
    setSyncLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        competitionCode,
      };

      if (!selectedCompetitionMapping && manualSeasonId) {
        payload.seasonId = Number(manualSeasonId);
      }

      const result = await postJson("/external/football/sync-matches", payload);

      setMessage(
        `Sync completed. External refreshed: ${result.refreshedExternalCount}, created internal: ${result.createdInternalCount}, updated internal: ${result.updatedInternalCount}, skipped: ${result.skippedCount}. Resolved seasonId: ${result.seasonId}.`
      );
    } catch {
      setError("Failed to sync external matches into internal Match table.");
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Real Sync</span>
        <h1 className="page-title">External Match Sync</h1>
        <p className="page-subtitle">
          Імпорт і синхронізація зовнішніх матчів у внутрішню таблицю Match.
          Якщо для ліги є competition mapping, сезон підставляється автоматично.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "22px" }}>
        <div className="card">
          <h3 className="card-title">Mapped teams</h3>
          <p className="card-muted">
            Кількість зовнішніх команд, які вже зв’язані з внутрішніми.
          </p>
          <div
            className="hero-panel-value"
            style={{ fontSize: "30px", marginBottom: 0 }}
          >
            {mappings.length}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Competition mapping</h3>
          <p className="card-muted">
            Чи має поточна ліга автоматичний зв’язок із внутрішнім сезоном.
          </p>
          <div
            className="hero-panel-value"
            style={{ fontSize: "24px", marginBottom: 0 }}
          >
            {selectedCompetitionMapping ? "Mapped" : "Manual"}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Target season</h3>
          <p className="card-muted">
            Внутрішній сезон, у який будуть записані матчі.
          </p>
          <div
            className="hero-panel-value"
            style={{ fontSize: "20px", marginBottom: 0 }}
          >
            {selectedSeason
              ? selectedSeason.tournamentName
                ? `${selectedSeason.tournamentName} • ${selectedSeason.name}`
                : selectedSeason.name
              : "-"}
          </div>
        </div>
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

        <select
          className="filter-select"
          value={manualSeasonId}
          onChange={(event) => setManualSeasonId(event.target.value)}
          disabled={Boolean(selectedCompetitionMapping)}
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

        <button
          type="button"
          className="hero-button hero-button-primary"
          onClick={handleSync}
          disabled={syncLoading || loading}
        >
          {syncLoading ? "Syncing..." : "Import + Sync"}
        </button>
      </div>

      {selectedCompetitionMapping ? (
        <div className="loading-state" style={{ marginTop: "18px" }}>
          Auto mapping active: {selectedCompetitionMapping.externalCompetitionName} →{" "}
          {selectedCompetitionMapping.internalSeasonName}
        </div>
      ) : (
        <div className="loading-state" style={{ marginTop: "18px" }}>
          No competition mapping found. Manual season selection will be used.
        </div>
      )}

      {loading ? <div className="loading-state">Loading sync page...</div> : null}

      {message ? (
        <div className="loading-state" style={{ marginTop: "18px" }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="error-state" style={{ marginTop: "18px" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}