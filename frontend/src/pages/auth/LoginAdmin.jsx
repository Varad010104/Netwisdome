import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./LoginAdmin.css";

const LoginAdmin = () => {
  // Controlled inputs
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (adminEmail === "admin@netwisdome.com" && adminPassword === "Admin@123") {
      // Hardcoded admin success
      const adminUser = {
        _id: "admin_id",
        name: "Admin",
        email: "admin@netwisdome.com",
        role: "admin"
      };
      localStorage.setItem("userInfo", JSON.stringify(adminUser));
      setAdminEmail("");
      setAdminPassword("");
      navigate("/admin/dashboard");
      return;
    }

    setError("Invalid credentials. Use: admin@netwisdome.com / Admin@123");
    setLoading(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-container">

        {/* Left Side - Admin Login Form */}
        <div className="admin-forms-container">
          <div className="admin-signin">
            <form className="admin-signin-form" onSubmit={handleAdminLogin}>
              <h2 className="admin-title">Admin Login</h2>

              <div className="admin-input-field">
                <input
                  type="email"
                  placeholder="Admin Email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="admin-input-field">
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

{error && <p className="error-msg" style={{color: 'red', fontSize: '0.85rem', margin: '5px 0'}}>{error}</p>}
              <button type="submit" className="admin-btn btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Admin Panel Info */}
        <div className="admin-panels-container">
          <div className="admin-panel">
            <div className="admin-panel-content">
              <h1>ADMIN PANEL</h1>
              <p>Login to manage users, exams and system settings</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginAdmin;
