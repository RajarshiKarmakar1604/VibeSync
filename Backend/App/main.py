import httpx
import secrets
import string
import asyncio
import urllib.parse
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import re

from config import settings
from auth import create_access_token, decode_access_token
from spotify import SpotifyClient

app = FastAPI(title="Spotify Comparability API")

FRONTEND_URL = "https://vibe-sync-navy.vercel.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_oauth_states: set[str] = set()
_rooms: dict[str, dict] = {}
_sessions: dict[str, dict] = {}  # short session ID -> user data
ROOM_CODE_TTL_MINUTES = 30
SESSION_TTL_MINUTES = 5  # short-lived, just for the handoff


def _generate_room_code() -> str:
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    while True:
        code = "".join(secrets.choice(alphabet) for _ in range(6))
        if code not in _rooms:
            return code


def _cleanup_expired_rooms():
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=ROOM_CODE_TTL_MINUTES)
    expired = [k for k, v in _rooms.items() if v["created_at"] < cutoff]
    for k in expired:
        del _rooms[k]


def _cleanup_expired_sessions():
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=SESSION_TTL_MINUTES)
    expired = [k for k, v in _sessions.items() if v["created_at"] < cutoff]
    for k in expired:
        del _sessions[k]






def _normalize(s: str) -> str:
    # Remove anything in parentheses/brackets like (From "Agneepath") or [Remastered]
    s = re.sub(r'\s*[\(\[].*?[\)\]]', '', s)
    # Remove common suffixes after a dash like - Remastered, - Live Version, - Radio Edit
    s = re.sub(r'\s*-\s*(remastered|live|radio edit|acoustic|remix|version|edit|mix|demo|reprise|instrumental).*', '', s, flags=re.IGNORECASE)
    return s.lower().strip()


def _fuzzy_match(only_a_ids, only_b_ids, map_a, map_b, common_ids):
    name_map_a = {}
    for tid in only_a_ids:
        t = map_a[tid]
        key = _normalize(t["name"]) + "|" + _normalize(t["artists"][0])
        name_map_a[key] = tid

    name_map_b = {}
    for tid in only_b_ids:
        t = map_b[tid]
        key = _normalize(t["name"]) + "|" + _normalize(t["artists"][0])
        name_map_b[key] = tid

    fuzzy_common_keys = set(name_map_a.keys()) & set(name_map_b.keys())

    for key in fuzzy_common_keys:
        tid_a = name_map_a[key]
        tid_b = name_map_b[key]
        only_a_ids.discard(tid_a)
        only_b_ids.discard(tid_b)
        common_ids.add(tid_a)

    return only_a_ids, only_b_ids, common_ids

# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.get("/login")
def login():
    state = secrets.token_urlsafe(16)
    _oauth_states.add(state)
    params = {
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "state": state,
        "scope": "user-library-read user-read-private user-read-email",
        "show_dialog": "true",
    }
    url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@app.get("/callback")
async def callback(code: str = Query(...), state: str = Query(...)):
    if state not in _oauth_states:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    _oauth_states.discard(state)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=(settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET),
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")

    token_data = resp.json()
    spotify_access_token = token_data["access_token"]
    spotify_refresh_token = token_data.get("refresh_token", "")

    profile = await SpotifyClient(spotify_access_token).get_profile()
    user_id = profile["id"]
    display_name = profile.get("display_name", user_id)

    # Store session server-side, only pass short ID to frontend
    _cleanup_expired_sessions()
    session_id = secrets.token_urlsafe(8)  # ~11 chars, safe for URLs
    _sessions[session_id] = {
        "sub": user_id,
        "display_name": display_name,
        "spotify_token": spotify_access_token,
        "refresh_token": spotify_refresh_token,
        "created_at": datetime.now(timezone.utc),
    }

    # Short ID in URL — no more giant JWT in query string
    frontend_url = f"{FRONTEND_URL}/?s={session_id}"
    return RedirectResponse(frontend_url)


@app.get("/session")
async def get_session(s: str = Query(...)):
    """
    Frontend calls this once with the short session ID.
    Returns a proper JWT. Session is deleted after use.
    """
    _cleanup_expired_sessions()
    if s not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found or expired. Please log in again.")

    data = _sessions.pop(s)  # delete after use — one-time only

    jwt_token = create_access_token({
        "sub": data["sub"],
        "display_name": data["display_name"],
        "spotify_token": data["spotify_token"],
        "refresh_token": data["refresh_token"],
    })

    return {"token": jwt_token}


@app.get("/me")
async def get_me(token: str = Query(...)):
    payload = decode_access_token(token)
    return {"user_id": payload["sub"], "display_name": payload["display_name"]}


# ─── Token Refresh ────────────────────────────────────────────────────────────

@app.post("/refresh")
async def refresh_token(body: dict):
    old_token = body.get("token")
    if not old_token:
        raise HTTPException(status_code=422, detail="token is required")

    try:
        payload = decode_access_token(old_token)
    except Exception:
        import jwt as pyjwt
        try:
            payload = pyjwt.decode(
                old_token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False},
            )
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token — please log in again.")

    refresh_token_str = payload.get("refresh_token", "")
    if not refresh_token_str:
        raise HTTPException(status_code=401, detail="No refresh token available — please log in again.")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token_str,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=(settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET),
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Spotify refresh failed — please log in again.")

    token_data = resp.json()
    new_spotify_token = token_data["access_token"]
    new_refresh_token = token_data.get("refresh_token", refresh_token_str)

    new_jwt = create_access_token({
        "sub": payload["sub"],
        "display_name": payload["display_name"],
        "spotify_token": new_spotify_token,
        "refresh_token": new_refresh_token,
    })

    return {"token": new_jwt}


# ─── Room Code ────────────────────────────────────────────────────────────────

@app.post("/room/create")
async def create_room(body: dict):
    token = body.get("token")
    if not token:
        raise HTTPException(status_code=422, detail="token is required")

    payload = decode_access_token(token)
    _cleanup_expired_rooms()

    for code, room in _rooms.items():
        try:
            existing = decode_access_token(room["token"])
            if existing["sub"] == payload["sub"]:
                return {"room_code": code, "expires_in_minutes": ROOM_CODE_TTL_MINUTES}
        except Exception:
            pass

    code = _generate_room_code()
    _rooms[code] = {
        "token": token,
        "display_name": payload["display_name"],
        "created_at": datetime.now(timezone.utc),
    }
    return {"room_code": code, "expires_in_minutes": ROOM_CODE_TTL_MINUTES}


@app.get("/room/check")
async def check_room(code: str = Query(...)):
    _cleanup_expired_rooms()
    code = code.strip().upper()
    if code not in _rooms:
        raise HTTPException(status_code=404, detail="Room not found or expired.")
    return {"valid": True, "host": _rooms[code]["display_name"]}


@app.post("/room/join")
async def join_room(body: dict):
    token_b = body.get("token")
    room_code = body.get("room_code", "").strip().upper()

    if not token_b or not room_code:
        raise HTTPException(status_code=422, detail="token and room_code are required")

    _cleanup_expired_rooms()

    if room_code not in _rooms:
        raise HTTPException(status_code=404, detail="Room not found or expired. Ask your friend to generate a new code.")

    token_a = _rooms[room_code]["token"]

    try:
        payload_a = decode_access_token(token_a)
    except Exception:
        del _rooms[room_code]
        raise HTTPException(status_code=401, detail="Room creator's session expired. Ask them to log in again.")

    payload_b = decode_access_token(token_b)

    if payload_a["sub"] == payload_b["sub"]:
        raise HTTPException(status_code=400, detail="You can't compare with yourself!")

    spotify_a = SpotifyClient(payload_a["spotify_token"])
    spotify_b = SpotifyClient(payload_b["spotify_token"])

    tracks_a, tracks_b = await asyncio.gather(
        spotify_a.get_all_liked_songs(),
        spotify_b.get_all_liked_songs(),
    )

    map_a = {t["id"]: t for t in tracks_a}
    map_b = {t["id"]: t for t in tracks_b}
    ids_a = set(map_a.keys())
    ids_b = set(map_b.keys())
    # First pass — exact ID match
    only_a_ids = ids_a - ids_b
    only_b_ids = ids_b - ids_a
    common_ids = ids_a & ids_b

    # Second pass — fuzzy match by name + artist
    only_a_ids, only_b_ids, common_ids = _fuzzy_match(
        only_a_ids, only_b_ids, map_a, map_b, common_ids
    )

    del _rooms[room_code]

    total = len(ids_a) + len(ids_b)
    compatibility = round((len(common_ids) * 2 / total) * 100, 1) if total > 0 else 0

    return {
        "user_a": {"id": payload_a["sub"], "display_name": payload_a["display_name"]},
        "user_b": {"id": payload_b["sub"], "display_name": payload_b["display_name"]},
        "only_a": [map_a[i] for i in only_a_ids],
        "only_b": [map_b[i] for i in only_b_ids],
        "common": [map_a[i] for i in common_ids],
        "stats": {
            "total_a": len(ids_a),
            "total_b": len(ids_b),
            "only_a_count": len(only_a_ids),
            "only_b_count": len(only_b_ids),
            "common_count": len(common_ids),
            "compatibility_score": compatibility,
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}
