import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { useNavigate } from 'react-router-dom';
import "./LoginAdmin.css";

/* ── Inline SVG icons (no external dependency) ── */
const IconLock = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 32, height: 32, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const LoginAdmin = () => {
  // "login" | "setup" | "locked"
  const [mode, setMode] = useState("login");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  /* Check whether an admin account already exists */
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { data } = await API.get("/auth/admin/check-setup");
        if (!data.isSetup) {
          // Setup state available
        }
      } catch (err) {
        console.error("Setup check failed:", err);
      }
    };
    checkSetup();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /* ── Handlers ── */
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const { data } = await API.post("/auth/admin/login", {
        email: adminEmail,
        password: adminPassword,
      });

      if (data?.user) {
        localStorage.setItem("userInfo", JSON.stringify(data.user));
        setAdminEmail("");
        setAdminPassword("");
        setSuccess("Login Successful!");
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 600);
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    if (adminPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.post("/auth/admin/register", {
        email: adminEmail,
        password: adminPassword,
        confirmPassword,
      });

      setSuccess(data.message || "Admin account created. You can now sign in.");
      setMode("login");
      setAdminPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err.response?.data?.message || "Setup failed. Please try again.";
      if (
        err.response?.status === 400 &&
        msg.toLowerCase().includes("already exists")
      ) {
        setMode("locked");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToSetup = async () => {
    clearMessages();
    try {
      const { data } = await API.get("/auth/admin/check-setup");
      if (data.isSetup) {
        setMode("locked");
      } else {
        setMode("setup");
      }
    } catch {
      setMode("setup");
    }
  };

  const switchToLogin = () => {
    clearMessages();
    setAdminEmail("");
    setAdminPassword("");
    setConfirmPassword("");
    setMode("login");
  };

  return (
    <div className="admin-login-page">
      {error && (
        <div className="admin-toast error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="admin-toast success" role="status">
          {success}
        </div>
      )}
      
      <div className="admin-card-container">
        <div className="admin-brand">
          <span className="admin-brand-dot"></span>
          <span className="admin-brand-name">Netwisdome</span>
        </div>
        
        {mode === "login" && (
          <div className="admin-form-section">
            <h2 className="admin-card-title">Admin Portal</h2>
            <p className="admin-card-subtitle">Sign in to access your administrative tools</p>
            
            <form onSubmit={handleAdminLogin} noValidate className="admin-form">
              <div className="admin-input-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="admin-input-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="admin-btn-submit" disabled={loading}>
                {loading ? <span className="admin-spinner" /> : "Sign In"}
              </button>
            </form>

            <div className="admin-card-footer">
              <p className="admin-toggle-text">
                No admin account yet?{" "}
                <span className="admin-toggle-link" onClick={switchToSetup} role="button" tabIndex={0}>
                  Create one
                </span>
              </p>
            </div>
          </div>
        )}

        {mode === "setup" && (
          <div className="admin-form-section">
            <h2 className="admin-card-title">Create Admin</h2>
            <p className="admin-card-subtitle">Configure the master administrator account</p>
            
            <form onSubmit={handleAdminSetup} noValidate className="admin-form">
              <div className="admin-input-group">
                <label htmlFor="setup-email">Email Address</label>
                <input
                  id="setup-email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="admin-input-group">
                <label htmlFor="setup-password">Password</label>
                <input
                  id="setup-password"
                  type="password"
                  placeholder="Create strong password"
                  required
                  autoComplete="new-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              <div className="admin-input-group">
                <label htmlFor="setup-confirm">Confirm Password</label>
                <input
                  id="setup-confirm"
                  type="password"
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="admin-btn-submit" disabled={loading}>
                {loading ? <span className="admin-spinner" /> : "Create Account"}
              </button>
            </form>

            <div className="admin-card-footer">
              <p className="admin-toggle-text">
                Already have an admin?{" "}
                <span className="admin-toggle-link" onClick={switchToLogin} role="button" tabIndex={0}>
                  Sign in
                </span>
              </p>
            </div>
          </div>
        )}

        {mode === "locked" && (
          <div className="admin-form-section admin-locked-section">
            <div className="admin-lock-icon-wrap">
              <IconLock />
            </div>
            <h2 className="admin-card-title">Registration Locked</h2>
            <p className="admin-card-subtitle">
              Only one admin account is allowed per installation. Please sign in with existing credentials.
            </p>
            
            <button className="admin-btn-submit" onClick={switchToLogin}>
              Go to Sign In
            </button>
            
            <button className="admin-btn-back" onClick={switchToLogin} type="button">
              <IconArrowLeft /> Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginAdmin;