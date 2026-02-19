const BASE = 'http://127.0.0.1:8000';

export const api = {
  login() {
    window.location.href = `${BASE}/login`;
  },

  async getMe(token) {
    const res = await fetch(`${BASE}/me?token=${token}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async createRoom(token) {
    const res = await fetch(`${BASE}/room/create`, {
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
    const res = await fetch(`${BASE}/room/join`, {
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
