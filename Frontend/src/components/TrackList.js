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
      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="Search tracks…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <span className={styles.count}>{filtered.length} tracks</span>
      </div>

      {/* List */}
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
  return (
    <a
      href={track.external_url}
      target="_blank"
      rel="noopener noreferrer"
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

      {/* Open icon */}
      <div className={styles.openIcon}>↗</div>
    </a>
  );
}

function MusicIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} opacity="0.6">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  );
}
