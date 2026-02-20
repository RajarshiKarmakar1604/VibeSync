import React, { useEffect } from 'react';
import styles from './AuthCallback.module.css';

const BASE = 'https://vibesync-m2n5.onrender.com';

export default function AuthCallback({ onAuth }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('s');

    if (sessionId) {
      // Exchange short session ID for a proper JWT
      fetch(`${BASE}/session?s=${sessionId}`)
        .then(res => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then(({ token }) => {
          onAuth(token);
          window.history.replaceState({}, '', '/');
        })
        .catch(() => {
          // Session failed, redirect to home to log in again
          window.location.href = '/';
        });
    } else {
      window.location.href = '/';
    }
  }, [onAuth]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <p className={styles.text}>Signing you in…</p>
    </div>
  );
}
