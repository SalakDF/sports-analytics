import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="page-kicker">Sports MVP</span>

          <h1 className="page-title">
            Modern platform for sports fans and match analytics
          </h1>

          <p className="page-subtitle">
            Переглядай матчі, команди та турнірну таблицю в одному зручному
            інтерфейсі. Це перша робоча версія дипломного веб-застосунку.
          </p>

          <div className="hero-actions">
            <Link to="/matches" className="hero-button hero-button-primary">
              Open matches
            </Link>

            <Link to="/standings" className="hero-button hero-button-secondary">
              View standings
            </Link>
          </div>
        </div>

        <div className="home-hero-side">
          <div className="hero-panel">
            <div className="hero-panel-label">Current scope</div>
            <div className="hero-panel-value">Matches • Teams • Table</div>
            <div className="hero-panel-text">
              Backend: Spring Boot + PostgreSQL
              <br />
              Frontend: React + Vite
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "28px" }}>
        <h2 className="section-title">Core modules</h2>

        <div className="grid grid-3">
          <div className="card">
            <h3 className="card-title">Matches</h3>
            <p className="card-muted">
              Список матчів, базові деталі події, статус матчу, рахунок і
              навігація до окремої сторінки.
            </p>
            <Link className="action-link" to="/matches">
              Go to matches →
            </Link>
          </div>

          <div className="card">
            <h3 className="card-title">Teams</h3>
            <p className="card-muted">
              Перегляд команд, короткої інформації про клуби та детальної
              сторінки кожної команди.
            </p>
            <Link className="action-link" to="/teams">
              Go to teams →
            </Link>
          </div>

          <div className="card">
            <h3 className="card-title">Standings</h3>
            <p className="card-muted">
              Таблиця сезону з позиціями команд, кількістю перемог, поразок,
              різницею голів та очками.
            </p>
            <Link className="action-link" to="/standings">
              Go to standings →
            </Link>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "28px" }}>
        <h2 className="section-title">Why this MVP matters</h2>

        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">Solid diploma foundation</h3>
            <p className="card-muted">
              Уже є повноцінне read-only ядро системи, яке можна показувати в
              дипломі: архітектура, API, база даних і сучасний інтерфейс.
            </p>
          </div>

          <div className="card">
            <h3 className="card-title">Ready for next features</h3>
            <p className="card-muted">
              Далі можна без хаосу додавати пошук, обране, авторизацію,
              статистику матчу та покращення UI.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}