import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
const redirectTarget = params.get('redirect');
  // Controlled inputs for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Controlled inputs for SignUp
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const errorTimerRef = useRef(null);
  const successTimerRef = useRef(null);
  const successNavigateRef = useRef(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      if (successNavigateRef.current) {
        clearTimeout(successNavigateRef.current);
      }
    };
  }, []);

  // ✅ Login Logic (Updated for strict Batch Filtering)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5055/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      if (response.data) {
        setErrorMessage('');
        setSuccessMessage('Login Successful!');
        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
        }
        successTimerRef.current = setTimeout(() => setSuccessMessage(''), 2000);

        // महत्वाचे: खात्री करा की response मध्ये batchId येत आहे. 
        // जर तुमचा डेटा response.data.user मध्ये असेल तर तसे सेव्ह करा.
        const userData = response.data.user ? response.data.user : response.data;
        
        // Save user data strictly
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        // Redirect to Dashboard
        if (successNavigateRef.current) {
          clearTimeout(successNavigateRef.current);
        }
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
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
      errorTimerRef.current = setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // ✅ SignUp Logic
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5055/api/auth/register-student', {
        name: signUpUsername,
        email: signUpEmail,
        password: signUpPassword,
      });
      alert("Registration Successful! Please Login.");
      setIsSignUpMode(false);
      // Reset signup fields
      setSignUpUsername('');
      setSignUpEmail('');
      setSignUpPassword('');
    } catch (error) {
      console.error("Signup Error:", error);
      alert(error.response?.data?.message || "Registration Failed");
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
      <div className={`container ${isSignUpMode ? 'sign-up-mode' : ''}`}>
        <div className="forms-container">
          <div className="signin-signup">

            {/* Login Form */}
            <form className="sign-in-form" onSubmit={handleLoginSubmit}>
              <h2 className="title">Sign In</h2>
              <div className="input-field">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="input-field">
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn">Login</button>
              <p className="social-text sign-in-toggle-hint">
                Don't have an account? 
                <span onClick={() => setIsSignUpMode(true)} className="toggle-link" style={{cursor: 'pointer', color: '#FF8C00', fontWeight: 'bold'}}> Register</span>
              </p>
            </form>

            {/* Register Form */}
            <form className="sign-up-form" onSubmit={handleSignUpSubmit}>
              <h2 className="title">Register</h2>
              <div className="input-field">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                />
              </div>
              <div className="input-field">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>
              <div className="input-field">
                <input
                  type="password"
                  placeholder="Create Password"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn">Register</button>
              <p className="social-text">
                Already have an account? 
                <span onClick={() => setIsSignUpMode(false)} className="toggle-link" style={{cursor: 'pointer', color: '#4481eb', fontWeight: 'bold'}}> Sign In</span>
              </p>
            </form>

          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h1>WELCOME!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="btn transparent" onClick={() => setIsSignUpMode(true)}>Sign Up</button>
            </div>
          </div>
          
          <div className="panel right-panel">
            <div className="content">
              <h1>WELCOME BACK!</h1>
              <p>Enter your personal details and start journey with us</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;





