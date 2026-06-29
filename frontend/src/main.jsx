import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios'

// Set up dynamic API URL redirection for production deployments
const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5055').replace('/api', '');
window.API_BASE_URL = apiBase;

// Intercept all Axios calls
axios.interceptors.request.use((config) => {
  if (config.url && config.url.includes('http://localhost:5055')) {
    config.url = config.url.replace('http://localhost:5055', apiBase);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept all native Fetch calls
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string' && input.includes('http://localhost:5055')) {
    input = input.replace('http://localhost:5055', apiBase);
  } else if (input instanceof Request && input.url.includes('http://localhost:5055')) {
    // If it's a Request object, clone and rewrite url
    const newUrl = input.url.replace('http://localhost:5055', apiBase);
    input = new Request(newUrl, input);
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
