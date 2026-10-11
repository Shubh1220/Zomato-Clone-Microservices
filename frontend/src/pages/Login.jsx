import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>{mode === "login" ? "Log in" : "Create an account"}</h1>

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === "register" && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <p className="status error">{error}</p>}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="muted">
        {mode === "login" ? (
          <>No account? <button className="link-button" onClick={() => setMode("register")}>Sign up</button></>
        ) : (
          <>Already have an account? <button className="link-button" onClick={() => setMode("login")}>Log in</button></>
        )}
      </p>

      <Link to="/">Back to restaurants</Link>
    </div>
  );
}
