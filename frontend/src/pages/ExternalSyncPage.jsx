import { useEffect, useState } from "react";
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
  const [seasonId, setSeasonId] = useState("");
  const [mappings, setMappings] = useState([]);
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
      const [seasonsData, mappingsData] = await Promise.all([
        fetchJson("/seasons"),
        fetchJson("/external/football/team-mappings"),
      ]);

      setSeasons(seasonsData);
      setMappings(mappingsData);

      if (seasonsData.length > 0) {
        setSeasonId(String(seasonsData[0].id));
      }
    } catch {
      setError("Failed to load sync data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (!seasonId) {
      setError("Please select season first.");
      return;
    }

    setSyncLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await postJson("/external/football/sync-matches", {
        competitionCode,
        seasonId: Number(seasonId),
      });

      setMessage(
        `Sync completed. External refreshed: ${result.refreshedExternalCount}, created internal: ${result.createdInternalCount}, updated internal: ${result.updatedInternalCount}, skipped: ${result.skippedCount}.`
      );
    } catch {
      setError("Failed to sync external matches into internal Match table.");
    } finally {
      setSyncLoading(false);
    }
  }

  const selectedSeason = seasons.find(
    (item) => String(item.id) === String(seasonId)
  );

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Real Sync</span>
        <h1 className="page-title">External Match Sync</h1>
        <p className="page-subtitle">
          Імпорт і синхронізація зовнішніх матчів у внутрішню таблицю Match
          через external cache, team mappings і вибраний сезон.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "22px" }}>
        <div className="card">
          <h3 className="card-title">Mapped teams</h3>
          <p className="card-muted">Кількість зовнішніх команд, які вже зв’язані з внутрішніми.</p>
          <div className="hero-panel-value" style={{ fontSize: "30px", marginBottom: 0 }}>
            {mappings.length}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Selected competition</h3>
          <p className="card-muted">Ліга, яку зараз будеш синхронізувати.</p>
          <div className="hero-panel-value" style={{ fontSize: "30px", marginBottom: 0 }}>
            {competitionCode}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Target season</h3>
          <p className="card-muted">Внутрішній сезон, куди будуть записані матчі.</p>
          <div className="hero-panel-value" style={{ fontSize: "20px", marginBottom: 0 }}>
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
          value={seasonId}
          onChange={(event) => setSeasonId(event.target.value)}
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