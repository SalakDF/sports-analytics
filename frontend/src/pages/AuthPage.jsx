import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJson } from "../api/client";
import { saveCurrentUser } from "../utils/session";

export default function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await postJson(endpoint, { email, password });
      saveCurrentUser(data);

      setMessage(
        mode === "login"
          ? "Login successful."
          : "Registration successful."
      );

      setTimeout(() => {
        navigate("/");
      }, 400);
    } catch {
      setError("Failed to complete authentication request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">Account</span>
        <h1 className="page-title">Authentication</h1>
        <p className="page-subtitle">
          Увійди в систему або створи акаунт, щоб працювати з favorites і
          персональним сценарієм користування.
        </p>
      </div>

      <div className="auth-layout auth-layout-premium">
        <div className="card auth-card auth-card-premium">
          <div className="auth-card-top">
            <span className="page-kicker">
              {mode === "login" ? "Welcome back" : "Create account"}
            </span>
            <h2 className="section-title" style={{ margin: 0 }}>
              {mode === "login" ? "Sign in to continue" : "Start using the platform"}
            </h2>
          </div>

          <div className="auth-switcher">
            <button
              type="button"
              className={
                mode === "login"
                  ? "hero-button hero-button-primary"
                  : "hero-button hero-button-secondary"
              }
              onClick={() => setMode("login")}
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode === "register"
                  ? "hero-button hero-button-primary"
                  : "hero-button hero-button-secondary"
              }
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="search-input"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="search-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="hero-button hero-button-primary auth-submit-button"
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </button>
          </form>

          {message ? (
            <div className="loading-state" style={{ marginTop: "16px" }}>
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="error-state" style={{ marginTop: "16px" }}>
              {error}
            </div>
          ) : null}
        </div>

        <div className="card auth-info-card auth-info-card-premium">
          <h2 className="section-title">What you get</h2>

          <div className="grid" style={{ gap: "12px" }}>
            <div className="mini-info-card auth-feature-card">
              <div className="mini-info-title">Favorites</div>
              <div className="mini-info-text">
                Збереження улюблених команд і матчів у власному профілі.
              </div>
            </div>

            <div className="mini-info-card auth-feature-card">
              <div className="mini-info-title">Quick access</div>
              <div className="mini-info-text">
                Швидкий доступ до обраного прямо з основного меню.
              </div>
            </div>

            <div className="mini-info-card auth-feature-card">
              <div className="mini-info-title">Personal flow</div>
              <div className="mini-info-text">
                Авторизація дає персоналізований сценарій користування системою.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}