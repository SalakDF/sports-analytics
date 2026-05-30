import { useEffect, useMemo, useState } from "react";
import { apiRequest, fetchJson, postJson, postRequest } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ExternalTeamMappingsPage() {
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [standings, setStandings] = useState(null);
  const [internalTeams, setInternalTeams] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoadingId, setSaveLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [autoMapLoading, setAutoMapLoading] = useState(false);
  const [importTeamsLoading, setImportTeamsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPageData();
  }, [competitionCode]);

  async function loadPageData() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [standingsData, internalTeamsData, mappingsData] = await Promise.all([
        fetchJson(`/external/football/competitions/${competitionCode}/standings/simple`),
        fetchJson("/teams"),
        fetchJson("/external/football/team-mappings"),
      ]);

      setStandings(standingsData);
      setInternalTeams(internalTeamsData);
      setMappings(mappingsData);

      const initialDrafts = {};
      for (const mapping of mappingsData) {
        initialDrafts[mapping.externalTeamId] = String(mapping.internalTeamId);
      }
      setDrafts(initialDrafts);
    } catch {
      setError("Failed to load team mapping data.");
    } finally {
      setLoading(false);
    }
  }

  function handleDraftChange(externalTeamId, value) {
    setDrafts((prev) => ({
      ...prev,
      [externalTeamId]: value,
    }));
  }

  async function handleSave(row) {
    const selectedInternalTeamId = drafts[row.teamId];

    if (!selectedInternalTeamId) {
      setError("Please select an internal team first.");
      return;
    }

    setSaveLoadingId(row.teamId);
    setError("");
    setMessage("");

    try {
      const saved = await postJson("/external/football/team-mappings", {
        externalTeamId: row.teamId,
        externalTeamName: row.teamName,
        internalTeamId: Number(selectedInternalTeamId),
      });

      setMappings((prev) => {
        const filtered = prev.filter(
          (item) => String(item.externalTeamId) !== String(saved.externalTeamId)
        );
        return [...filtered, saved];
      });

      setMessage(`Saved mapping: ${saved.externalTeamName} → ${saved.internalTeamName}`);
    } catch {
      setError("Failed to save team mapping.");
    } finally {
      setSaveLoadingId(null);
    }
  }

  async function handleDelete(row) {
    setDeleteLoadingId(row.teamId);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/external/football/team-mappings/${row.teamId}`, {
        method: "DELETE",
      });

      setMappings((prev) =>
        prev.filter((item) => String(item.externalTeamId) !== String(row.teamId))
      );

      setDrafts((prev) => ({
        ...prev,
        [row.teamId]: "",
      }));

      setMessage(`Deleted mapping for ${row.teamName}.`);
    } catch {
      setError("Failed to delete team mapping.");
    } finally {
      setDeleteLoadingId(null);
    }
  }

  async function handleAutoMap() {
    setAutoMapLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await postRequest(
        `/external/football/team-mappings/auto?competitionCode=${competitionCode}`
      );

      setMessage(
        `Auto-map completed. Total external teams: ${result.totalExternalTeams}, newly mapped: ${result.mappedCount}, already mapped: ${result.alreadyMappedCount}, skipped: ${result.skippedCount}.`
      );

      await loadPageData();
    } catch {
      setError("Failed to auto-map teams.");
    } finally {
      setAutoMapLoading(false);
    }
  }

  async function handleImportTeams() {
    setImportTeamsLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await postRequest(
        `/external/football/competitions/${competitionCode}/import-teams`
      );

      setMessage(
        `Teams import completed. External teams: ${result.totalExternalTeams}, created internal teams: ${result.createdTeams}, already existing: ${result.alreadyExistingTeams}.`
      );

      await loadPageData();
    } catch {
      setError("Failed to import missing teams.");
    } finally {
      setImportTeamsLoading(false);
    }
  }

  const rows = standings?.rows || [];

  const mappingMap = useMemo(() => {
    const map = {};
    for (const item of mappings) {
      map[item.externalTeamId] = item;
    }
    return map;
  }, [mappings]);

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Sync Preparation</span>
        <h1 className="page-title">External Team Mapping</h1>
        <p className="page-subtitle">
          Тут ми зв’язуємо зовнішні команди з football-data.org із твоїми
          внутрішніми командами. Можна імпортувати відсутні, мапити вручну,
          через safe auto-map або прибрати неправильний зв’язок.
        </p>
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

        <button
          type="button"
          className="hero-button hero-button-secondary"
          onClick={handleImportTeams}
          disabled={importTeamsLoading || loading}
        >
          {importTeamsLoading ? "Importing teams..." : "Import missing teams"}
        </button>

        <button
          type="button"
          className="hero-button hero-button-primary"
          onClick={handleAutoMap}
          disabled={autoMapLoading || loading}
        >
          {autoMapLoading ? "Auto-mapping..." : "Auto-map teams"}
        </button>
      </div>

      {message ? (
        <div className="loading-state" style={{ marginBottom: "18px" }}>
          {message}
        </div>
      ) : null}

      {loading ? <div className="loading-state">Loading team mappings...</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        !rows.length ? (
          <div className="empty-state">No external teams found.</div>
        ) : (
          <div className="grid" style={{ gap: "14px" }}>
            {rows.map((row) => {
              const existingMapping = mappingMap[row.teamId];

              return (
                <div className="card" key={row.teamId}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.1fr 1fr auto auto",
                      gap: "14px",
                      alignItems: "center",
                    }}
                  >
                    <div className="team-inline">
                      <TeamLogo name={row.teamName} size="sm" />
                      <div className="team-inline-text">
                        <div className="team-inline-name">{row.teamName}</div>
                        <div className="team-inline-subtitle">
                          External ID: {row.teamId}
                        </div>
                      </div>
                    </div>

                    <div>
                      <select
                        className="filter-select"
                        value={drafts[row.teamId] || ""}
                        onChange={(event) =>
                          handleDraftChange(row.teamId, event.target.value)
                        }
                        style={{ width: "100%" }}
                      >
                        <option value="">Select internal team</option>
                        {internalTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>

                      {existingMapping ? (
                        <div
                          className="team-inline-subtitle"
                          style={{ marginTop: "8px" }}
                        >
                          Current: {existingMapping.internalTeamName}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="hero-button hero-button-primary"
                      onClick={() => handleSave(row)}
                      disabled={saveLoadingId === row.teamId}
                    >
                      {saveLoadingId === row.teamId ? "Saving..." : "Save"}
                    </button>

                    {existingMapping ? (
                      <button
                        type="button"
                        className="hero-button hero-button-secondary"
                        onClick={() => handleDelete(row)}
                        disabled={deleteLoadingId === row.teamId}
                      >
                        {deleteLoadingId === row.teamId ? "Deleting..." : "Delete"}
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
}