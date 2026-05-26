import { useEffect, useState } from "react";
import TeamLogo from "../components/common/TeamLogo";
import { fetchJson, postRequest } from "../api/client";

const COMPETITIONS = [
  { code: "PL", label: "Premier League" },
  { code: "BL1", label: "Bundesliga" },
  { code: "PD", label: "La Liga" },
  { code: "SA", label: "Serie A" },
  { code: "CL", label: "Champions League" },
];

export default function ImportedMatchesPage() {
  const [competitionCode, setCompetitionCode] = useState("PL");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadImportedMatches();
  }, [competitionCode]);

  async function loadImportedMatches() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(
        `/external/football/imported-matches?competitionCode=${competitionCode}`
      );
      setMatches(data);
    } catch {
      setError("Failed to load imported matches.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setImportLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await postRequest(
        `/external/football/competitions/${competitionCode}/import`
      );

      setMessage(
        `Import completed. Imported: ${result.importedCount}, updated: ${result.updatedCount}, total: ${result.totalCount}.`
      );

      await loadImportedMatches();
    } catch {
      setError("Failed to import matches into database.");
    } finally {
      setImportLoading(false);
    }
  }

  function getStatusClass(status) {
    if (status === "IN_PLAY") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Imported Data</span>
        <h1 className="page-title">Imported Matches</h1>
        <p className="page-subtitle">
          Матчі, які вже збережені у твоїй власній базі даних після імпорту із
          football-data.org.
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
          className="hero-button hero-button-primary"
          onClick={handleImport}
          disabled={importLoading}
        >
          {importLoading ? "Importing..." : "Import to DB"}
        </button>
      </div>

      {message ? (
        <div className="loading-state" style={{ marginBottom: "18px" }}>
          {message}
        </div>
      ) : null}

      {loading ? <div className="loading-state">Loading imported matches...</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        !matches.length ? (
          <div className="empty-state">
            No imported matches found for this competition yet.
          </div>
        ) : (
          <div className="grid grid-2">
            {matches.map((match) => (
              <div className="card" key={match.id}>
                <div className="match-card-header">
                  <div className="match-teams-stack">
                    <div className="team-inline">
                      <TeamLogo name={match.homeTeamName} size="sm" />
                      <div className="team-inline-text">
                        <div className="team-inline-name">{match.homeTeamName}</div>
                        <div className="team-inline-subtitle">Home</div>
                      </div>
                    </div>

                    <div className="team-inline">
                      <TeamLogo name={match.awayTeamName} size="sm" />
                      <div className="team-inline-text">
                        <div className="team-inline-name">{match.awayTeamName}</div>
                        <div className="team-inline-subtitle">Away</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      className="score-value"
                      style={{ fontSize: "28px", marginBottom: "8px" }}
                    >
                      {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                    </div>

                    <span className={getStatusClass(match.status)}>
                      {match.status}
                    </span>
                  </div>
                </div>

                <p className="card-muted" style={{ marginTop: "14px" }}>
                  {match.competitionName || match.competitionCode}
                </p>

                <p className="card-muted">
                  {match.utcDate
                    ? new Date(match.utcDate).toLocaleString()
                    : "Date not available"}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}