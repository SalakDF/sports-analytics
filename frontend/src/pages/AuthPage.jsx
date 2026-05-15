import { useState } from "react";
import { saveCurrentUser } from "../utils/session";

export default function AuthPage() {
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
          ? "Login successful. User saved in local storage."
          : "Registration successful. User saved in local storage."
      );
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
          Мінімальна сторінка для реєстрації та входу в MVP-версії застосунку.
        </p>
      </div>

      <div className="card" style={{ maxWidth: "560px" }}>
        <div className="meta-row" style={{ marginBottom: "18px" }}>
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
          <input
            className="search-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            className="search-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            type="submit"
            className="hero-button hero-button-primary"
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
    </div>
  );
}