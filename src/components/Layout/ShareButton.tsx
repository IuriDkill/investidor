import { useEffect, useState } from 'react';
import { shareLink } from '@/utils/shareLink';
import styles from './style.module.css';

type Status = 'idle' | 'copied' | 'failed';
const LABELS: Record<Status, string> = { idle: 'Copiar link', copied: 'Link copiado', failed: 'Não foi possível copiar' };
const RESET_AFTER_MS = 2000;

export default function ShareButton({ pathname, store }: { pathname: string; store: Map<string, unknown> }) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), RESET_AFTER_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink(window.location.origin, pathname, store));
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <button type="button" className={styles.share} aria-label="Copiar link" onClick={copy}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.shareIcon}>
        <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
      </svg>
      <span aria-live="polite">{LABELS[status]}</span>
    </button>
  );
}
