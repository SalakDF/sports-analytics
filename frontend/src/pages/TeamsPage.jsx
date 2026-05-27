import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../api/client";
import TeamLogo from "../components/common/TeamLogo";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadTeams();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  async function loadTeams() {
    setLoading(true);
    setError("");

    try {
      const query = search.trim()
        ? `/teams?search=${encodeURIComponent(search.trim())}`
        : "/teams";

      const data = await fetchJson(query);
      setTeams(data);
    } catch {
      setError("Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Clubs</span>
        <h1 className="page-title">Teams</h1>
        <p className="page-subtitle">
          Перегляд команд із пошуком через backend API, короткою інформацією і
          переходом до детальної сторінки.
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

      {loading ? <div className="loading-state">Loading teams...</div> : null}
      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        <>
          <p className="results-count">Found teams: {teams.length}</p>

          {!teams.length ? (
            <div className="empty-state">No teams found.</div>
          ) : (
            <div className="grid grid-2">
              {teams.map((team) => (
                <div className="card team-list-card" key={team.id}>
                  <div className="team-inline team-list-card-top">
                    <TeamLogo
                      name={team.name}
                      shortName={team.shortName}
                      logoUrl={team.logoUrl}
                    />

                    <div className="team-inline-text">
                      <div className="team-inline-name">
                        {team.name}
                        {team.shortName ? ` (${team.shortName})` : ""}
                      </div>
                      <div className="team-inline-subtitle">
                        {team.country || "Country not specified"}
                      </div>
                    </div>
                  </div>

                  <div className="meta-row">
                    <span className="badge">
                      Founded: {team.foundedYear || "-"}
                    </span>
                    {team.country ? <span className="badge">{team.country}</span> : null}
                  </div>

                  <p className="card-muted team-description-preview">
                    {team.description || "No description available."}
                  </p>

                  <Link className="action-link" to={`/teams/${team.id}`}>
                    Open team →
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