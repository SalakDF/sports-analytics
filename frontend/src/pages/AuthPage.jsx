import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJson } from "../api/client";
import { saveCurrentUser } from "../utils/session";
import { useLanguage } from "../context/LanguageContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
          ? t("auth.loginSuccess", "Login successful.")
          : t("auth.registerSuccess", "Registration successful.")
      );

      setTimeout(() => navigate("/"), 400);
    } catch {
      setError(t("auth.error", "Failed to complete authentication request."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-kicker">{t("auth.kicker", "Account")}</span>
        <h1 className="page-title">{t("auth.title", "Authentication")}</h1>
      </div>

      <div className="auth-layout auth-layout-premium">
        <div className="card auth-card auth-card-premium">
          <div className="auth-card-top">
            <span className="page-kicker">
              {mode === "login" ? t("auth.welcomeBack", "Welcome back") : t("auth.createAccount", "Create account")}
            </span>
            <h2 className="section-title" style={{ margin: 0 }}>
              {mode === "login"
                ? t("auth.signInContinue", "Sign in to continue")
                : t("auth.startPlatform", "Start using the platform")}
            </h2>
          </div>

          <div className="auth-switcher">
            <button
              type="button"
              className={mode === "login" ? "hero-button hero-button-primary" : "hero-button hero-button-secondary"}
              onClick={() => setMode("login")}
            >
              {t("auth.login", "Login")}
            </button>
            <button
              type="button"
              className={mode === "register" ? "hero-button hero-button-primary" : "hero-button hero-button-secondary"}
              onClick={() => setMode("register")}
            >
              {t("auth.register", "Register")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">{t("auth.email", "Email")}</label>
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
              <label className="form-label">{t("auth.password", "Password")}</label>
              <input
                className="search-input"
                type="password"
                placeholder={t("auth.passwordPlaceholder", "Minimum 6 characters")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button type="submit" className="hero-button hero-button-primary auth-submit-button" disabled={loading}>
              {loading ? t("auth.pleaseWait", "Please wait...") : mode === "login" ? t("auth.login", "Login") : t("auth.register", "Register")}
            </button>
          </form>

          {message ? <div className="loading-state" style={{ marginTop: "16px" }}>{message}</div> : null}
          {error ? <div className="error-state" style={{ marginTop: "16px" }}>{error}</div> : null}
        </div>
      </div>
    </div>
  );
}
