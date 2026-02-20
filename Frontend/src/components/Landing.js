import React, { useEffect, useRef } from 'react';
import { api } from '../api';
import styles from './Landing.module.css';

export default function Landing() {
  const titleRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (!titleRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 7;
      titleRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.noise} />
      <div className={styles.glow} />

      <nav className={styles.nav}>
        <span className={styles.navLogo}>VibeSync</span>
        <span className={styles.navTag}>Vibe Sync Checker</span>
      </nav>

      <div className={styles.ruleTop} />

      <div className={styles.hero}>
        <div className={styles.leftCol}>
          <div className={styles.verticalText}>EST. 2025 — BETA</div>
          <div className={styles.verticalLine} />
        </div>

        <div className={styles.centerCol}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Who do you really listen like?
          </div>

          <h1 className={styles.title} ref={titleRef}>
            <span className={styles.line1}>VibeSync</span>
            
          </h1>

          <p className={styles.desc}>
            Connect your Spotify. Find the overlap.<br />
            Discover what makes your taste uniquely yours.
          </p>

          <button className={styles.cta} onClick={api.login}>
            <span className={styles.ctaLeft}>
              <SpotifyIcon />
              <span>Continue with Spotify</span>
            </span>
            <span className={styles.ctaArrow}>→</span>
          </button>

          <p className={styles.footnote}>
            Both users log in separately — no data is stored.
          </p>
        </div>

        <div className={styles.rightCol}>
          <StatCard num="∞" label="Songs compared" />
          <div className={styles.statDivider} />
          <StatCard num="2" label="Users needed" />
          <div className={styles.statDivider} />
          <StatCard num="3" label="Result sets" />
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.ruleBottom} />
        <div className={styles.bottomContent}>
          <span className={styles.bottomLeft}>©Rajarshi</span>
          <div className={styles.pills}>
            <span className={styles.pill}>Your songs</span>
            <span className={styles.pill}>Friend's songs</span>
            <span className={styles.pillAccent}>In common</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ num, label }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statNum}>{num}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}
