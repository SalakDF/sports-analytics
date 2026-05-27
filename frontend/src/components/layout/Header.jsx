import { NavLink, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser } from "../../utils/session";

export default function Header() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  function handleLogout() {
    clearCurrentUser();
    navigate("/auth");
  }

  return (
    <header className="header">
      <div className="logo">Sports Analytics</div>

      <div className="header-right">
        <nav className="nav">
          <NavLink to="/" className={getLinkClass} end>
            Home
          </NavLink>

          <NavLink to="/matches" className={getLinkClass}>
            Matches
          </NavLink>

          <NavLink to="/teams" className={getLinkClass}>
            Teams
          </NavLink>

          <NavLink to="/standings" className={getLinkClass}>
            Standings
          </NavLink>

          {currentUser?.id ? (
            <NavLink to="/favorites" className={getLinkClass}>
              Favorites
            </NavLink>
          ) : null}

          {!currentUser?.id ? (
            <NavLink to="/auth" className={getLinkClass}>
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