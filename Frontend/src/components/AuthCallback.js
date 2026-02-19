import React, { useEffect } from 'react';
import styles from './AuthCallback.module.css';

export default function AuthCallback({ onAuth }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      onAuth(token);
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, [onAuth]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <p className={styles.text}>Signing you in…</p>
    </div>
  );
}
