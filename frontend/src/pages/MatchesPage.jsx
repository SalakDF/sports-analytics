import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadMatches();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  async function loadMatches() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const query = params.toString()
        ? `/matches?${params.toString()}`
        : "/matches";

      const data = await fetchJson(query);
      setMatches(data);
    } catch {
      setError("Failed to load matches.");
    } finally {
      setLoading(false);
    }
  }

  const getStatusClass = (status) => {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  };

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Fixtures</span>
        <h1 className="page-title">Matches</h1>
        <p className="page-subtitle">
          Список матчів з backend-пошуком і фільтрацією за статусом.
        </p>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by teams or tournament..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="FINISHED">Finished</option>
          <option value="POSTPONED">Postponed</option>
          <option value="CANCELED">Canceled</option>
        </select>
      </div>

      {loading ? <div className="loading-state">Loading matches...</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        <>
          <p className="results-count">Found: {matches.length}</p>

          {!matches.length ? (
            <div className="empty-state">No matches found.</div>
          ) : (
            <div className="grid grid-2">
              {matches.map((match) => (
                <div className="card" key={match.id}>
                  <div className="match-card-header">
                    <div className="match-teams-stack">
                      <div className="team-inline">
                        <TeamLogo
                          name={match.homeTeamName}
                          logoUrl={match.homeTeamLogoUrl}
                          size="sm"
                        />
                        <div className="team-inline-text">
                          <div className="team-inline-name">{match.homeTeamName}</div>
                          <div className="team-inline-subtitle">Home</div>
                        </div>
                      </div>

                      <div className="team-inline">
                        <TeamLogo
                          name={match.awayTeamName}
                          logoUrl={match.awayTeamLogoUrl}
                          size="sm"
                        />
                        <div className="team-inline-text">
                          <div className="team-inline-name">{match.awayTeamName}</div>
                          <div className="team-inline-subtitle">Away</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="score-value" style={{ fontSize: "28px", marginBottom: "8px" }}>
                        {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                      </div>
                      <span className={getStatusClass(match.status)}>
                        {match.status}
                      </span>
                    </div>
                  </div>

                  <p className="card-muted" style={{ marginTop: "16px" }}>
                    {match.tournamentName} • {match.seasonName}
                  </p>

                  <div className="meta-row">
                    <span className="badge">{match.roundName || "Round -"}</span>
                    <span className="badge">Venue: {match.venue || "-"}</span>
                  </div>

                  <Link className="action-link" to={`/matches/${match.id}`}>
                    Open match →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}