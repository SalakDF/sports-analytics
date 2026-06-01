import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span className="page-kicker">404</span>
        <h1 className="page-title">{t("notFound.title", "Page not found")}</h1>
        <p className="page-subtitle">
          {t("notFound.subtitle", "This page does not exist or has been moved.")}
        </p>

        <div className="detail-actions">
          <Link to="/" className="hero-button hero-button-primary">
            {t("notFound.goHome", "Go home")}
          </Link>
          <Link to="/matches" className="hero-button hero-button-secondary">
            {t("notFound.openMatches", "Open matches")}
          </Link>
        </div>
      </div>
    </div>
  );
}
