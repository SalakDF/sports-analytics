import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser } from "../../utils/session";
import { useTimezone } from "../../context/TimezoneContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatTimeZoneLabel } from "../../utils/datetime";

export default function Header() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const { timezone, setTimezone, options } = useTimezone();
  const { language, setLanguage, t } = useLanguage();

  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  function handleLogout() {
    clearCurrentUser();
    setMenuOpen(false);
    navigate("/auth");
  }

  function handleCloseMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">Sports Analytics</div>

        <button
          type="button"
          className={`mobile-menu-toggle ${menuOpen ? "mobile-menu-toggle-open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={t("header.toggleMenu", "Toggle menu")}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`header-right ${menuOpen ? "header-right-open" : ""}`}>
        <nav className="nav nav-responsive">
          <NavLink to="/" className={getLinkClass} end onClick={handleCloseMenu}>
            {t("header.home", "Home")}
          </NavLink>

          <NavLink to="/matches" className={getLinkClass} onClick={handleCloseMenu}>
            {t("header.matches", "Matches")}
          </NavLink>

          <NavLink to="/teams" className={getLinkClass} onClick={handleCloseMenu}>
            {t("header.teams", "Teams")}
          </NavLink>

          <NavLink to="/standings" className={getLinkClass} onClick={handleCloseMenu}>
            {t("header.standings", "Standings")}
          </NavLink>

          {currentUser?.id ? (
            <NavLink to="/favorites" className={getLinkClass} onClick={handleCloseMenu}>
              {t("header.favorites", "Favorites")}
            </NavLink>
          ) : null}

          {!currentUser?.id ? (
            <NavLink to="/auth" className={getLinkClass} onClick={handleCloseMenu}>
              {t("header.auth", "Auth")}
            </NavLink>
          ) : null}
        </nav>

        <div className="header-user-block">
          <label className="timezone-switcher">
            <span className="timezone-label">{t("header.language", "Language")}</span>
            <select
              className="timezone-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="ua">UA</option>
              <option value="en">EN</option>
            </select>
          </label>

          <label className="timezone-switcher">
            <span className="timezone-label">{formatTimeZoneLabel(timezone)}</span>
            <select
              className="timezone-select"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {options.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          {currentUser?.email ? (
            <>
              <span className="header-user-email">{currentUser.email}</span>
              <button
                type="button"
                className="hero-button hero-button-secondary header-logout-button"
                onClick={handleLogout}
              >
                {t("header.logout", "Logout")}
              </button>
            </>
          ) : (
            <span className="header-user-email">{t("header.guest", "Guest")}</span>
          )}
        </div>
      </div>
    </header>
  );
}
