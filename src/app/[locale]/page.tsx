import {useTranslations} from 'next-intl';

export default function Index() {
  const t = useTranslations('Index');
  return (
    <main style={{ padding: 'var(--spacing-lg)' }}>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </main>
  );
}
