import httpx
from fastapi import HTTPException


SPOTIFY_API_BASE = "https://api.spotify.com/v1"
LIKED_SONGS_LIMIT = 50  # Spotify max per page


class SpotifyClient:
    def __init__(self, access_token: str):
        self.headers = {"Authorization": f"Bearer {access_token}"}

    async def get_profile(self) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{SPOTIFY_API_BASE}/me", headers=self.headers)
        print("STATUS:", resp.status_code)
        print("BODY:", resp.text)
        print("HEADERS SENT:", self.headers)
        resp.raise_for_status()
        return resp.json()

    async def get_all_liked_songs(self) -> list[dict]:
        """
        Pages through the Spotify /me/tracks endpoint and returns
        a flat list of simplified track objects.
        """
        tracks = []
        url = f"{SPOTIFY_API_BASE}/me/tracks?limit={LIKED_SONGS_LIMIT}&offset=0"

        async with httpx.AsyncClient() as client:
            while url:
                resp = await client.get(url, headers=self.headers)
                if resp.status_code == 401:
                    raise HTTPException(status_code=401, detail="Spotify token expired or invalid.")
                resp.raise_for_status()

                data = resp.json()
                for item in data.get("items", []):
                    track = item.get("track")
                    if not track:
                        continue
                    tracks.append({
                        "id": track["id"],
                        "name": track["name"],
                        "artists": [a["name"] for a in track["artists"]],
                        "album": track["album"]["name"],
                        "album_art": (
                            track["album"]["images"][0]["url"]
                            if track["album"]["images"]
                            else None
                        ),
                        "preview_url": track.get("preview_url"),
                        "external_url": track["external_urls"].get("spotify"),
                    })

                url = data.get("next")  # None when we've reached the last page

        return tracks


#uvicorn main:app --reload --port 8000
#source venv/Scripts/activate
