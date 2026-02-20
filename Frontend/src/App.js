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

  // Check if there's a session ID in the URL (coming back from Spotify login)
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('s');

  const handleAuth = useCallback((newToken) => {
    storeToken(newToken);
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  // Session ID in URL = just came back from Spotify, exchange for JWT
  if (sessionId) {
    return <AuthCallback onAuth={handleAuth} />;
  }

  // Already logged in
  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  // Not logged in
  return <Landing />;
}
