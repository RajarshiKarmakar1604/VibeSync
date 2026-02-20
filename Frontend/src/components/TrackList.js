import React, { useState } from 'react';
import styles from './TrackList.module.css';

const PAGE_SIZE = 50;

export default function TrackList({ tracks, color }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = tracks.filter(t => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.artists.join(' ').toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
  });

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const colors = {
    green: { accent: 'var(--green)', bg: 'var(--green-muted)' },
    blue:  { accent: 'var(--blue)',  bg: 'var(--blue-muted)' },
    red:   { accent: 'var(--red)',   bg: 'var(--red-muted)' },
  };
  const c = colors[color] || colors.green;

  return (
    <div>
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="Search tracks…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <span className={styles.count}>{filtered.length} tracks</span>
      </div>

      <div className={styles.list}>
        {visible.map((track, i) => (
          <TrackRow key={track.id} track={track} index={i} accent={c.accent} bg={c.bg} />
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>No tracks found.</div>
        )}
      </div>

      {hasMore && (
        <button className={styles.loadMore} onClick={() => setPage(p => p + 1)}>
          Load more ({filtered.length - visible.length} remaining)
        </button>
      )}
    </div>
  );
}

function TrackRow({ track, index, accent, bg }) {
  const openInSpotify = (e) => {
    e.preventDefault();
    if (track.external_url) {
      window.open(track.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={styles.row}
      style={{ animationDelay: `${Math.min(index * 15, 300)}ms` }}
    >
      {/* Album art */}
      <div className={styles.art} style={{ background: bg }}>
        {track.album_art
          ? <img src={track.album_art} alt={track.album} />
          : <MusicIcon color={accent} />
        }
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.name}>{track.name}</div>
        <div className={styles.meta}>
          {track.artists.join(', ')}
          <span className={styles.sep}>·</span>
          {track.album}
        </div>
      </div>

      {/* Open in Spotify button */}
      {track.external_url && (
        <button
          className={styles.spotifyBtn}
          onClick={openInSpotify}
          title="Open in Spotify"
        >
          <SpotifyIcon />
        </button>
      )}
    </div>
  );
}

function MusicIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} opacity="0.6">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}
