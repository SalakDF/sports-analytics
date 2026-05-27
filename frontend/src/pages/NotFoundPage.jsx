import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span className="page-kicker">404</span>
        <h1 className="page-title">Page not found</h1>
        <p className="page-subtitle">
          Схоже, що сторінка, яку ти відкрив, не існує або була переміщена.
        </p>

        <div className="detail-actions">
          <Link to="/" className="hero-button hero-button-primary">
            Go home
          </Link>

          <Link to="/matches" className="hero-button hero-button-secondary">
            Open matches
          </Link>
        </div>
      </div>
    </div>
  );
}