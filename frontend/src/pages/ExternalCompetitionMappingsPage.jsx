import { useEffect, useMemo, useState } from "react";
import { fetchJson, postJson } from "../api/client";

const COMPETITIONS = [
  { code: "PL", name: "Premier League" },
  { code: "BL1", name: "Bundesliga" },
  { code: "PD", name: "La Liga" },
  { code: "SA", name: "Serie A" },
  { code: "CL", name: "Champions League" },
];

export default function ExternalCompetitionMappingsPage() {
  const [seasons, setSeasons] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoadingCode, setSaveLoadingCode] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [seasonsData, mappingsData] = await Promise.all([
        fetchJson("/seasons"),
        fetchJson("/external/football/competition-mappings"),
      ]);

      setSeasons(seasonsData);
      setMappings(mappingsData);

      const initialDrafts = {};
      for (const mapping of mappingsData) {
        initialDrafts[mapping.externalCompetitionCode] = String(
          mapping.internalSeasonId
        );
      }
      setDrafts(initialDrafts);
    } catch {
      setError("Failed to load competition mapping data.");
    } finally {
      setLoading(false);
    }
  }

  function handleDraftChange(code, value) {
    setDrafts((prev) => ({
      ...prev,
      [code]: value,
    }));
  }

  async function handleSave(competition) {
    const selectedSeasonId = drafts[competition.code];

    if (!selectedSeasonId) {
      setError("Please select an internal season first.");
      return;
    }

    setSaveLoadingCode(competition.code);
    setError("");
    setMessage("");

    try {
      const saved = await postJson("/external/football/competition-mappings", {
        externalCompetitionCode: competition.code,
        externalCompetitionName: competition.name,
        internalSeasonId: Number(selectedSeasonId),
      });

      setMappings((prev) => {
        const filtered = prev.filter(
          (item) =>
            String(item.externalCompetitionCode) !==
            String(saved.externalCompetitionCode)
        );
        return [...filtered, saved];
      });

      setMessage(
        `Saved mapping: ${saved.externalCompetitionName} → ${saved.internalSeasonName}`
      );
    } catch {
      setError("Failed to save competition mapping.");
    } finally {
      setSaveLoadingCode(null);
    }
  }

  const mappingMap = useMemo(() => {
    const map = {};
    for (const item of mappings) {
      map[item.externalCompetitionCode] = item;
    }
    return map;
  }, [mappings]);

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Sync Preparation</span>
        <h1 className="page-title">External Competition Mapping</h1>
        <p className="page-subtitle">
          Тут ми зв’язуємо зовнішній турнір із football-data.org з внутрішнім
          сезоном у твоїй БД, щоб sync міг автоматично вибирати правильний
          seasonId.
        </p>
      </div>

      {message ? (
        <div className="loading-state" style={{ marginBottom: "18px" }}>
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="loading-state">Loading competition mappings...</div>
      ) : null}

      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        <div className="grid" style={{ gap: "14px" }}>
          {COMPETITIONS.map((competition) => {
            const existingMapping = mappingMap[competition.code];

            return (
              <div className="card" key={competition.code}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr auto",
                    gap: "14px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div className="team-inline-name">{competition.name}</div>
                    <div className="team-inline-subtitle">
                      External code: {competition.code}
                    </div>
                  </div>

                  <div>
                    <select
                      className="filter-select"
                      value={drafts[competition.code] || ""}
                      onChange={(event) =>
                        handleDraftChange(competition.code, event.target.value)
                      }
                      style={{ width: "100%" }}
                    >
                      <option value="">Select internal season</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.tournamentName
                            ? `${season.tournamentName} • ${season.name}`
                            : season.name}
                        </option>
                      ))}
                    </select>

                    {existingMapping ? (
                      <div
                        className="team-inline-subtitle"
                        style={{ marginTop: "8px" }}
                      >
                        Current: {existingMapping.internalSeasonName}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="hero-button hero-button-primary"
                    onClick={() => handleSave(competition)}
                    disabled={saveLoadingCode === competition.code}
                  >
                    {saveLoadingCode === competition.code ? "Saving..." : "Save"}
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