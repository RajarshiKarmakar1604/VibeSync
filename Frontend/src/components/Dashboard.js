import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import TrackList from './TrackList';
import ShareCard from './ShareCard';
import styles from './Dashboard.module.css';

const STEPS = {
  IDLE: 'idle',
  JOINING: 'joining',
  COMPARING: 'comparing',
  RESULTS: 'results',
};

export default function Dashboard({ token, onLogout }) {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [step, setStep] = useState(STEPS.IDLE);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('only_a');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getMe(token).then(setUser).catch(() => onLogout());
  }, [token, onLogout]);

  // Auto-create room code on load
  useEffect(() => {
    if (!token) return;
    api.createRoom(token).then(({ room_code }) => setRoomCode(room_code)).catch(() => {});
  }, [token]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = useCallback(async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Enter a valid 6-character code.');
      return;
    }
    setError('');
    setStep(STEPS.COMPARING);
    try {
      const data = await api.joinRoom(token, code);
      setResults(data);
      setStep(STEPS.RESULTS);
    } catch (e) {
      setError(e.message);
      setStep(STEPS.JOINING);
    }
  }, [token, inputCode]);

  const reset = () => {
    setStep(STEPS.IDLE);
    setResults(null);
    setInputCode('');
    setError('');
    setActiveTab('only_a');
    // Regenerate room code
    api.createRoom(token).then(({ room_code }) => setRoomCode(room_code)).catch(() => {});
  };

  if (!user) return <LoadingScreen />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.noise} />

      <header className={styles.header}>
        <span className={styles.logo}><em>VibeSync</em></span>
        <div className={styles.headerRight}>
          <span className={styles.userChip}>
            <span className={styles.dot} />
            {user.display_name}
          </span>
          <button className={styles.logoutBtn} onClick={onLogout}>Log out</button>
        </div>
      </header>

      <main className={styles.main}>

        {/* ── IDLE: show your code + input friend's code ── */}
        {step === STEPS.IDLE && (
          <div className={styles.section}>

            {/* Your code */}
            <div className={styles.card}>
              <div className={styles.cardLabel}>Your room code</div>
              <div className={styles.codeDisplay}>
                {roomCode
                  ? roomCode.split('').map((char, i) => (
                      <span key={i} className={styles.codeChar}>{char}</span>
                    ))
                  : [1,2,3,4,5,6].map(i => <span key={i} className={styles.codeChar} style={{opacity:0.2}}>·</span>)
                }
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardHint}>Share this with your friend</span>
                <button
                  className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
                  onClick={copyCode}
                  disabled={!roomCode}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className={styles.dividerRow}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>then</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Enter friend's code */}
            <div className={styles.card}>
              <div className={styles.cardLabel}>Friend's room code</div>
              <input
                className={styles.codeInput}
                placeholder="E.g. XK4J2M"
                value={inputCode}
                onChange={e => {
                  setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  setError('');
                }}
                maxLength={6}
                spellCheck={false}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                className={styles.compareBtn}
                onClick={handleJoin}
                disabled={inputCode.length !== 6}
              >
                Compare libraries →
              </button>
            </div>

          </div>
        )}

        {/* ── COMPARING ── */}
        {step === STEPS.COMPARING && (
          <div className={styles.loadingSection}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Fetching both libraries…</p>
            <p className={styles.loadingHint}>This can take a moment for large libraries.</p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === STEPS.RESULTS && results && (
          <div className={styles.results}>

            {/* Shareable compatibility card */}
            <ShareCard results={results} />

            {/* Stats row */}
            <div className={styles.statsBar}>
              <Stat label="Your songs" value={results.stats.total_a} />
              <Stat label="Friend's songs" value={results.stats.total_b} />
              <Stat label="In common" value={results.stats.common_count} accent="green" />
              <Stat label="Only yours" value={results.stats.only_a_count} accent="blue" />
              <Stat label="Only theirs" value={results.stats.only_b_count} accent="red" />
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              <Tab active={activeTab === 'only_a'} color="blue" onClick={() => setActiveTab('only_a')}
                label={`Only you (${results.stats.only_a_count})`} />
              <Tab active={activeTab === 'only_b'} color="red" onClick={() => setActiveTab('only_b')}
                label={`Only ${results.user_b.display_name} (${results.stats.only_b_count})`} />
              <Tab active={activeTab === 'common'} color="green" onClick={() => setActiveTab('common')}
                label={`In common (${results.stats.common_count})`} />
            </div>

            <TrackList
              tracks={activeTab === 'only_a' ? results.only_a : activeTab === 'only_b' ? results.only_b : results.common}
              color={activeTab === 'only_a' ? 'blue' : activeTab === 'only_b' ? 'red' : 'green'}
            />

            <button className={styles.ghostBtn} onClick={reset} style={{ marginTop: '2rem' }}>
              ← Start over
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, accent }) {
  const colors = { green: 'var(--green)', blue: 'var(--blue)', red: 'var(--red)' };
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700,
        color: accent ? colors[accent] : 'var(--text-primary)',
      }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function Tab({ active, color, onClick, label }) {
  const colors = { green: 'var(--green)', blue: 'var(--blue)', red: 'var(--red)' };
  const bgColors = { green: 'var(--green-muted)', blue: 'var(--blue-muted)', red: 'var(--red-muted)' };
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem',
      fontFamily: 'var(--font-body)', fontWeight: active ? 500 : 400,
      background: active ? bgColors[color] : 'transparent',
      color: active ? colors[color] : 'var(--text-muted)',
      border: `1px solid ${active ? colors[color] + '44' : 'transparent'}`,
      transition: 'all 0.2s', cursor: 'pointer',
    }}>{label}</button>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}
