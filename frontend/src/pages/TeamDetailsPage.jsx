import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchJson } from "../api/client";

export default function TeamDetailsPage() {
  const { id } = useParams();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson(`/teams/${id}`)
      .then((data) => setTeam(data))
      .catch(() => setError("Failed to load team details"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading team details...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!team) return <div className="empty-state">Team not found.</div>;

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Club Profile</span>
        <h1 className="page-title">{team.name}</h1>
        <p className="page-subtitle">
          Детальна сторінка команди з базовою інформацією, роком заснування та
          коротким описом.
        </p>
      </div>

      <div className="hero-card">
        <div className="team-hero">
          <div className="team-hero-main">
            <div className="team-details-name">{team.name}</div>
            <div className="meta-row">
              <span className="badge">
                {team.shortName ? `Code: ${team.shortName}` : "Code: -"}
              </span>
              <span className="badge">
                {team.country ? `Country: ${team.country}` : "Country: -"}
              </span>
              <span className="badge">
                Founded: {team.foundedYear || "-"}
              </span>
            </div>
          </div>

          <div className="team-hero-side">
            <div className="team-logo-placeholder">
              {team.shortName || team.name?.slice(0, 3)?.toUpperCase() || "TEAM"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card">
          <h2 className="section-title">Overview</h2>

          <p className="card-muted">
            <strong>Name:</strong> {team.name || "-"}
          </p>
          <p className="card-muted">
            <strong>Short name:</strong> {team.shortName || "-"}
          </p>
          <p className="card-muted">
            <strong>Country:</strong> {team.country || "-"}
          </p>
          <p className="card-muted">
            <strong>Founded:</strong> {team.foundedYear || "-"}
          </p>
        </div>

        <div className="card">
          <h2 className="section-title">Description</h2>

          <p className="card-muted">
            {team.description || "No description available for this team yet."}
          </p>

          <Link className="action-link" to="/teams">
            ← Back to teams
          </Link>
        </div>
      </div>
    </div>
  );
}