import { NavLink } from "react-router-dom";

export default function Header() {
  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="header">
      <div className="logo">Sports Analytics</div>

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

        <NavLink to="/favorites" className={getLinkClass}>
          Favorites
        </NavLink>

        <NavLink to="/auth" className={getLinkClass}>
          Auth
        </NavLink>
      </nav>
    </header>
  );
}