import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser } from "../../utils/session";

export default function Header() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

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
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`header-right ${menuOpen ? "header-right-open" : ""}`}>
        <nav className="nav nav-responsive">
          <NavLink to="/" className={getLinkClass} end onClick={handleCloseMenu}>
            Home
          </NavLink>

          <NavLink to="/matches" className={getLinkClass} onClick={handleCloseMenu}>
            Matches
          </NavLink>

          <NavLink to="/teams" className={getLinkClass} onClick={handleCloseMenu}>
            Teams
          </NavLink>

          <NavLink to="/standings" className={getLinkClass} onClick={handleCloseMenu}>
            Standings
          </NavLink>

          {currentUser?.id ? (
            <NavLink to="/favorites" className={getLinkClass} onClick={handleCloseMenu}>
              Favorites
            </NavLink>
          ) : null}

          {!currentUser?.id ? (
            <NavLink to="/auth" className={getLinkClass} onClick={handleCloseMenu}>
              Auth
            </NavLink>
          ) : null}
        </nav>

        <div className="header-user-block">
          {currentUser?.email ? (
            <>
              <span className="header-user-email">{currentUser.email}</span>
              <button
                type="button"
                className="hero-button hero-button-secondary header-logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <span className="header-user-email">Guest</span>
          )}
        </div>
      </div>
    </header>
  );
}