import React, { useRef, useState } from 'react';
import styles from './ShareCard.module.css';

export default function ShareCard({ results }) {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const rawScore = results.stats.compatibility_score;
  const score = rawScore < 1 ? rawScore.toFixed(1) : rawScore;
  const userA = results.user_a.display_name;
  const userB = results.user_b.display_name;

  // Pick vibe label based on score
  const vibe =
    score >= 80 ? { label: 'Musical Soulmates', emoji: '🔥' } :
    score >= 60 ? { label: 'Kindred Ears',       emoji: '✨' } :
    score >= 40 ? { label: 'Common Ground',       emoji: '🎵' } :
    score >= 20 ? { label: 'Different Worlds',    emoji: '🌍' } :
                  { label: 'Total Opposites',     emoji: '❄️' };

  // Pick arc color
  const arcColor = score >= 60 ? '#18e96a' : score >= 35 ? '#5096ff' : '#ff5050';

  // SVG arc calculation
  const R = 80;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference - (score / 100) * circumference;

  const handleExport = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      // Dynamically load html2canvas from CDN
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const canvas = await window.html2canvas(cardRef.current, {
        backgroundColor: '#0d0d0d',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${userA}-vs-${userB}-VibeSync.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* The actual card that gets screenshot */}
      <div className={styles.card} ref={cardRef}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <span className={styles.cardBrand}>VibeSync</span>
          <span className={styles.cardDate}>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Names */}
        <div className={styles.names}>
          <span className={styles.nameA}>{userA}</span>
          <span className={styles.nameVs}>vs</span>
          <span className={styles.nameB}>{userB}</span>
        </div>

        {/* Score ring */}
        <div className={styles.ringWrapper}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            {/* Track */}
            <circle
              cx={cx} cy={cy} r={R}
              fill="none" stroke="#1a1a1a" strokeWidth="10"
            />
            {/* Fill */}
            <circle
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={arcColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ filter: `drop-shadow(0 0 8px ${arcColor}88)` }}
            />
          </svg>
          <div className={styles.ringInner}>
            <div className={styles.ringScore} style={{ color: arcColor }}>{score}</div>
            <div className={styles.ringPct}>%</div>
            <div className={styles.ringLabel}>match</div>
          </div>
        </div>

        {/* Vibe */}
        <div className={styles.vibe}>
          <span className={styles.vibeEmoji}>{vibe.emoji}</span>
          <span className={styles.vibeLabel}>{vibe.label}</span>
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <MiniStat value={results.stats.common_count} label="In common" color="#18e96a" />
          <MiniStat value={results.stats.only_a_count} label={`Only ${userA}`} color="#5096ff" />
          <MiniStat value={results.stats.only_b_count} label={`Only ${userB}`} color="#ff5050" />
        </div>

        {/* Top shared tracks */}
        {results.common.length > 0 && (
          <div className={styles.topTracks}>
            <div className={styles.topTracksLabel}>Top shared tracks</div>
            {results.common.slice(0, 3).map((t, i) => (
              <div key={t.id} className={styles.trackRow}>
                <span className={styles.trackIdx}>{i + 1}</span>
                <div className={styles.trackInfo}>
                  <div className={styles.trackName}>{t.name}</div>
                  <div className={styles.trackArtist}>{t.artists[0]}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          VibeSync.app
        </div>
      </div>

      {/* Export button — outside the card so it's not in the screenshot */}
      <button
        className={styles.exportBtn}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? (
          <><span className={styles.exportSpinner} /> Generating…</>
        ) : (
          <>↓ Save as image</>
        )}
      </button>
    </div>
  );
}

function MiniStat({ value, label, color }) {
  return (
    <div className={styles.miniStat}>
      <div className={styles.miniStatNum} style={{ color }}>{value.toLocaleString()}</div>
      <div className={styles.miniStatLabel}>{label}</div>
    </div>
  );
}
