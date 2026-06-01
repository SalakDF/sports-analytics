import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, fetchJson } from "../api/client";
import { getCurrentUser } from "../utils/session";
import TeamLogo from "../components/common/TeamLogo";
import { useLanguage } from "../context/LanguageContext";

export default function TeamDetailsPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchJson(`/teams/${id}`)
      .then(setTeam)
      .catch(() => setError(t("teamDetails.errorLoad", "Failed to load team details.")))
      .finally(() => setLoading(false));
    fetchJson(`/teams/${id}/stats`).then(setStats).catch(() => setStats(null)).finally(() => setStatsLoading(false));
  }, [id, t]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) return;
    fetchJson(`/favorites/teams?userId=${user.id}`)
      .then((f) => setIsFavorite(f.some((x) => String(x.teamId) === String(id))))
      .catch(() => setIsFavorite(false));
  }, [id]);

  async function toggleFavorite() {
    const user = getCurrentUser();
    if (!user?.id) return;
    await apiRequest(`/favorites/teams?userId=${user.id}&teamId=${id}`, { method: isFavorite ? "DELETE" : "POST" });
    setIsFavorite((v) => !v);
  }

  if (loading) return <div className="loading-state">{t("teamDetails.loading", "Loading team details...")}</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!team) return <div className="empty-state">{t("teamDetails.notFound", "Team not found.")}</div>;

  return (
    <div>
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-top-row">
            <span className="page-kicker">{t("teamDetails.kicker", "Club Profile")}</span>
            <div className="meta-row">
              <span className="badge">{team.country || "-"}</span>
              <span className="badge">{t("teams.played", "Played")}: {stats?.matchesPlayed ?? "-"}</span>
            </div>
          </div>
          <div className="detail-hero-brand">
            <TeamLogo name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} size="lg" />
            <div className="detail-hero-brand-text">
              <h1 className="detail-title">{team.name}</h1>
              <p className="detail-subtitle">{t("teamDetails.subtitle", "Team details and key statistics.")}</p>
            </div>
          </div>
          <div className="detail-actions">
            <button type="button" className="hero-button hero-button-secondary" onClick={toggleFavorite}>
              {isFavorite ? t("teamDetails.removeFav", "Remove from favorites") : t("teamDetails.addFav", "Add to favorites")}
            </button>
            <Link to="/teams" className="hero-button hero-button-secondary">{t("teamDetails.backTeams", "Back to teams")}</Link>
          </div>
        </div>
      </section>

      <div className="grid grid-2" style={{ marginTop: "22px" }}>
        <div className="card detail-card">
          <h2 className="section-title">{t("teamDetails.overview", "Overview")}</h2>
          <div className="detail-info-grid">
            <div className="detail-info-item"><span className="detail-info-label">{t("teamDetails.fullName", "Full name")}</span><span className="detail-info-value">{team.name || "-"}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">{t("teamDetails.shortName", "Short name")}</span><span className="detail-info-value">{team.shortName || "-"}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">{t("teamDetails.country", "Country")}</span><span className="detail-info-value">{team.country || "-"}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">{t("teams.played", "Played")}</span><span className="detail-info-value">{stats?.matchesPlayed ?? "-"}</span></div>
          </div>
        </div>
        <div className="card detail-card">
          <h2 className="section-title">{t("teamDetails.description", "Description")}</h2>
          <p className="detail-paragraph">{team.description || t("teamDetails.noDescription", "No description available.")}</p>
        </div>
      </div>

      <div className="card detail-card" style={{ marginTop: "22px" }}>
        <h2 className="section-title">{t("teamDetails.stats", "Team Statistics")}</h2>
        {statsLoading ? <div className="loading-state">{t("teamDetails.statsLoading", "Loading team stats...")}</div> : !stats ? <div className="empty-state">{t("teamDetails.noStats", "No team stats available.")}</div> : (
          <div className="detail-info-grid">
            <div className="detail-info-item"><span className="detail-info-label">{t("teams.played", "Played")}</span><span className="detail-info-value">{stats.matchesPlayed}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">{t("home.wins", "Wins")}</span><span className="detail-info-value">{stats.wins}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">{t("teams.winRate", "Win rate")}</span><span className="detail-info-value">{stats.winRate}%</span></div>
            <div className="detail-info-item"><span className="detail-info-label">{t("teams.goals", "Goals")}</span><span className="detail-info-value">{stats.goalsFor}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
