'use client';

import { useTranslations } from 'next-intl';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Error');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '24px',
      textAlign: 'center',
      fontFamily: 'var(--font-body, sans-serif)',
      color: 'var(--color-text, #f5f5f5)',
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: '12px',
        color: '#ef4444',
      }}>
        {t('title')}
      </h2>
      <p style={{
        fontSize: '1rem',
        color: 'var(--color-text-muted, #888)',
        marginBottom: '24px',
        maxWidth: '400px',
      }}>
        {t('description')}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: 'var(--color-primary, #2b4a80)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          {t('reload')}
        </button>
        <a
          href="/"
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'transparent',
            color: 'var(--color-text, #f5f5f5)',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          {t('goHome')}
        </a>
      </div>
      {process.env.NODE_ENV === 'development' && error.digest && (
        <pre style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#666',
          maxWidth: '100%',
          overflow: 'auto',
        }}>
          {error.digest}
        </pre>
      )}
    </div>
  );
}
