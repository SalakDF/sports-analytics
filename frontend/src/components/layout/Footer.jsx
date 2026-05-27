export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="site-footer-brand">Sports Analytics</div>
          <p className="site-footer-text">
            Вебзастосунок для спортивних любителів із матчами, командами,
            турнірними таблицями, favorites і зовнішньою інтеграцією даних.
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