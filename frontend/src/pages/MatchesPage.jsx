import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../api/client";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson("/matches")
      .then((data) => setMatches(data))
      .catch(() => setError("Failed to load matches"))
      .finally(() => setLoading(false));
  }, []);

  const filteredMatches = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return matches.filter((match) => {
      const matchesSearch =
        !normalized ||
        match.homeTeamName?.toLowerCase().includes(normalized) ||
        match.awayTeamName?.toLowerCase().includes(normalized) ||
        match.tournamentName?.toLowerCase().includes(normalized);

      const matchesStatus =
        statusFilter === "ALL" || match.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [matches, search, statusFilter]);

  const getStatusClass = (status) => {
    if (status === "LIVE") return "badge badge-live";
    if (status === "FINISHED") return "badge badge-finished";
    return "badge badge-scheduled";
  };

  if (loading) return <div className="loading-state">Loading matches...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Fixtures</span>
        <h1 className="page-title">Matches</h1>
        <p className="page-subtitle">
          Список матчів сезону з пошуком по командах і базовою фільтрацією за статусом.
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

      <p className="results-count">Found: {filteredMatches.length}</p>

      {!filteredMatches.length ? (
        <div className="empty-state">No matches found.</div>
      ) : (
        <div className="grid grid-2">
          {filteredMatches.map((match) => (
            <div className="card" key={match.id}>
              <h2 className="card-title">
                {match.homeTeamName} vs {match.awayTeamName}
              </h2>

              <p className="card-muted">
                {match.tournamentName} • {match.seasonName}
              </p>

              <div className="meta-row">
                <span className={getStatusClass(match.status)}>
                  {match.status}
                </span>
                <span className="badge">
                  Score: {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                </span>
                <span className="badge">{match.roundName || "Round -"}</span>
              </div>

              <p className="card-muted" style={{ marginTop: "14px" }}>
                Venue: {match.venue || "-"}
              </p>

              <Link className="action-link" to={`/matches/${match.id}`}>
                Open match →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}