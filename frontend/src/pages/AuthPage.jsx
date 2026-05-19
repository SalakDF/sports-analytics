import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveCurrentUser } from "../utils/session";

export default function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint =
    mode === "login"
      ? "http://localhost:8080/api/auth/login"
      : "http://localhost:8080/api/auth/register";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Authentication request failed");
      }

      const data = await response.json();
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
          Увійди в систему або створи акаунт, щоб працювати з обраним.
        </p>
      </div>

      <div className="auth-layout">
        <div className="card auth-card">
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

        <div className="card auth-info-card">
          <h2 className="section-title">What you get</h2>

          <div className="grid" style={{ gap: "12px" }}>
            <div className="mini-info-card">
              <div className="mini-info-title">Favorites</div>
              <div className="mini-info-text">
                Збереження улюблених команд і матчів.
              </div>
            </div>

            <div className="mini-info-card">
              <div className="mini-info-title">Quick access</div>
              <div className="mini-info-text">
                Швидкий перехід до обраного прямо з меню.
              </div>
            </div>

            <div className="mini-info-card">
              <div className="mini-info-title">MVP flow</div>
              <div className="mini-info-text">
                Проста базова авторизація для дипломного проєкту.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}