import { useTranslations } from 'next-intl';
import { LogoCodeva } from '../shared/icons';
import styles from './app-footer.module.css';

export default function AppFooter() {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <span className={styles.copyright}>
          © {currentYear} Stringo
        </span>
        <span className={styles.divider}>·</span>
        <span className={styles.credits}>{t('credits')}</span>
        <a href="https://www.codeva.com.ar" target="_blank" rel="noopener noreferrer" className={styles.logoLink}>
          <LogoCodeva className={styles.logo} />
        </a>
      </div>
    </footer>
  );
}
