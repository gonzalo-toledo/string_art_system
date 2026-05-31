import Link from 'next/link';
import LanguageSelector from './language-selector';
import styles from './app-header.module.css';

type AppHeaderProps = {
  locale: string;
};

export default function AppHeader({ locale }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Link href={`/${locale}/editor`} className={styles.logoLink}>
          <img src="/hagalo-logo.png" alt="HÁGALO" className={styles.logoImage} />
        </Link>
        <div className={styles.headerActions}>
          <LanguageSelector currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
