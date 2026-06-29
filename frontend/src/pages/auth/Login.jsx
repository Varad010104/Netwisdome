import React, { useEffect, useRef, useState } from 'react';
import API from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const redirectTarget = params.get('redirect');

  // Controlled inputs for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const errorTimerRef = useRef(null);
  const successTimerRef = useRef(null);
  const successNavigateRef = useRef(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (successNavigateRef.current) clearTimeout(successNavigateRef.current);
    };
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      if (response.data) {
        setErrorMessage('');
        setSuccessMessage('Login Successful!');
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setSuccessMessage(''), 2000);

        const userData = response.data.user ? response.data.user : response.data;
        localStorage.setItem('userInfo', JSON.stringify(userData));

        if (successNavigateRef.current) clearTimeout(successNavigateRef.current);
        successNavigateRef.current = setTimeout(() => {
          if (redirectTarget === 'assignments') {
            navigate('/student/all-assessments');
          } else {
            navigate('/student/dashboard');
          }
        }, 600);
      }
    } catch (error) {
      console.error("Login Error:", error);
      const message = error.response?.data?.message || "Invalid Email or Password";
      setErrorMessage(message);
      setSuccessMessage('');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <div className="login-page">
      {errorMessage && (
        <div className="login-toast" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="login-toast success" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}
      
      <div className="login-card-container">
        <div className="login-brand">
          <span className="login-brand-dot"></span>
          <span className="login-brand-name">Netwisdome</span>
        </div>
        
        <h2 className="login-card-title">Student Portal</h2>
        <p className="login-card-subtitle">Sign in to access your assessments & dashboard</p>
        
        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="login-input-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>
          
          <div className="login-input-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="login-btn-submit">
            Sign In
          </button>
        </form>

        <div className="login-card-footer">
          <Link to="/" className="login-back-home">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
