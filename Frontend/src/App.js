import React, { useState, useCallback } from 'react';
import Landing from './components/Landing';
import AuthCallback from './components/AuthCallback';
import Dashboard from './components/Dashboard';

const TOKEN_KEY = 'sp_cmp_token';

function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

function storeToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); }
  catch {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); }
  catch {}
}

export default function App() {
  const [token, setToken] = useState(() => getStoredToken());

  // Check if there's a token in the URL (coming back from Spotify auth)
  const hash = window.location.hash;
const urlToken = hash.startsWith('#token=') ? hash.slice(7) : null;

  const handleAuth = useCallback((newToken) => {
    storeToken(newToken);
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  // Token in URL = just came back from Spotify login
  if (urlToken) {
    return <AuthCallback onAuth={handleAuth} />;
  }

  // Logged in
  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  // Not logged in
  return <Landing />;
}