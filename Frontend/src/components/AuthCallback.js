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
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Data:', data);
    if (data.token) {
      onAuth(data.token);
      window.history.replaceState({}, '', '/');
    }
  })
  .catch(err => {
    console.error('FETCH ERROR:', err);
    // Don't redirect, stay on page so we can see the error
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
