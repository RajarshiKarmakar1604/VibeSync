# VibeSync — Backend

FastAPI backend for the VibeSync app.

## Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Make sure your `.env` is in `Backend/App/`:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback
```

Also add a strong `JWT_SECRET` to `.env` before deploying:
```
JWT_SECRET=some-long-random-string
```

## Run the server

```bash
cd Backend/App
uvicorn main:app --reload --port 8000
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | Redirects user to Spotify OAuth |
| GET | `/callback` | Spotify redirects here; issues JWT |
| GET | `/me?token=<jwt>` | Returns user profile |
| GET | `/liked-songs?token=<jwt>` | Returns all liked songs |
| POST | `/compare` | Compares two users' liked songs |
| GET | `/health` | Health check |

### POST /compare

**Body:**
```json
{
  "token_a": "<jwt for user A>",
  "token_b": "<jwt for user B>"
}
```

**Response:**
```json
{
  "user_a": { "id": "...", "display_name": "Alice" },
  "user_b": { "id": "...", "display_name": "Bob" },
  "only_a": [ { "id": "...", "name": "...", "artists": [...], ... } ],
  "only_b": [ ... ],
  "common": [ ... ],
  "stats": {
    "total_a": 300,
    "total_b": 450,
    "only_a_count": 180,
    "only_b_count": 330,
    "common_count": 120
  }
}
```

## Auth Flow (for React frontend)

```
1. User clicks "Login with Spotify"
2. React redirects to GET /login
3. /login → redirects to Spotify
4. User approves → Spotify → GET /callback?code=...&state=...
5. /callback fetches Spotify token, gets user profile, issues JWT
6. /callback → redirects to http://localhost:3000/auth-callback?token=<jwt>
7. React stores the JWT (localStorage / state)
8. React uses the JWT as ?token= in subsequent API calls
```
