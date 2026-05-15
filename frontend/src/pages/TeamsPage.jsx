import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../api/client";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson("/teams")
      .then((data) => setTeams(data))
      .catch(() => setError("Failed to load teams"))
      .finally(() => setLoading(false));
  }, []);

  const filteredTeams = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) return teams;

    return teams.filter((team) => {
      const name = team.name?.toLowerCase() || "";
      const shortName = team.shortName?.toLowerCase() || "";
      const country = team.country?.toLowerCase() || "";

      return (
        name.includes(normalized) ||
        shortName.includes(normalized) ||
        country.includes(normalized)
      );
    });
  }, [teams, search]);

  if (loading) return <div className="loading-state">Loading teams...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Clubs</span>
        <h1 className="page-title">Teams</h1>
        <p className="page-subtitle">
          Перегляд футбольних команд із пошуком по назві, короткій назві та країні.
        </p>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by team name, short name or country..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <p className="results-count">Found: {filteredTeams.length}</p>

      {!filteredTeams.length ? (
        <div className="empty-state">No teams found.</div>
      ) : (
        <div className="grid grid-2">
          {filteredTeams.map((team) => (
            <div className="card" key={team.id}>
              <h2 className="card-title">
                {team.name}
                {team.shortName ? ` (${team.shortName})` : ""}
              </h2>

              <div className="meta-row">
                <span className="badge">{team.country || "Country -"}</span>
                <span className="badge">
                  Founded: {team.foundedYear || "-"}
                </span>
              </div>

              <p className="card-muted" style={{ marginTop: "14px" }}>
                {team.description || "No description available."}
              </p>

              <Link className="action-link" to={`/teams/${team.id}`}>
                Open team →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}