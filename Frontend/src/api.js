//const BASE = 'http://127.0.0.1:8000';
const BASE = 'https://vibesync-m2n5.onrender.com/';
const TOKEN_KEY = 'sp_cmp_token';

// ─── Token storage helpers ────────────────────────────────────────────────────
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t) {
  try { localStorage.setItem(TOKEN_KEY, t); } catch {}
}

// ─── Auto-refresh wrapper ─────────────────────────────────────────────────────
// Every API call goes through this. If we get a 401, try refreshing once then retry.
async function fetchWithRefresh(url, options = {}) {
  let res = await fetch(url, options);

  if (res.status === 401) {
    const currentToken = getToken();
    if (!currentToken) throw new Error('Not logged in');

    // Try to refresh
    const refreshRes = await fetch(`${BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken }),
    });

    if (!refreshRes.ok) {
      // Refresh failed — force logout
      setToken(null);
      window.location.href = '/';
      throw new Error('Session expired. Please log in again.');
    }

    const { token: newToken } = await refreshRes.json();
    setToken(newToken);

    // Retry original request with new token
    // Replace old token in URL if it's a query param
    const newUrl = url.replace(/token=[^&]+/, `token=${newToken}`);
    // Replace in body if it's a POST
    let newOptions = { ...options };
    if (options.body) {
      const body = JSON.parse(options.body);
      if (body.token) body.token = newToken;
      newOptions.body = JSON.stringify(body);
    }
    res = await fetch(newUrl, newOptions);
  }

  return res;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export const api = {
  login() {
    window.location.href = `${BASE}/login`;
  },

  async getMe(token) {
    const res = await fetchWithRefresh(`${BASE}/me?token=${token}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async createRoom(token) {
    const res = await fetchWithRefresh(`${BASE}/room/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error('Failed to create room');
    return res.json();
  },

  async checkRoom(code) {
    const res = await fetch(`${BASE}/room/check?code=${code}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Room not found');
    }
    return res.json();
  },

  async joinRoom(token, roomCode) {
    const res = await fetchWithRefresh(`${BASE}/room/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, room_code: roomCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to join room');
    }
    return res.json();
  },
};
