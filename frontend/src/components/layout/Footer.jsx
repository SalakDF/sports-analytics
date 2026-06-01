import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="site-footer-brand">Sports Analytics</div>
          <p className="site-footer-text">
            {t(
              "footer.description",
              "Sports web app with matches, teams, standings, favorites and external data integration."
            )}
          </p>
        </div>

        <div className="site-footer-meta">
          <span>React + Vite</span>
          <span>Spring Boot + PostgreSQL</span>
          <span>{year}</span>
        </div>
      </div>
    </footer>
  );
}
