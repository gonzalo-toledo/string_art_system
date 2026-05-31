"use client";

import { useRouter } from 'next/navigation';
import styles from './app-header.module.css';

type LanguageSelectorProps = {
  currentLocale: string;
};

export default function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/[a-z]{2}/, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <select
      value={currentLocale}
      onChange={(e) => handleLocaleChange(e.target.value)}
      className={styles.languageSelect}
    >
      <option value="es">ES</option>
      <option value="en">EN</option>
      <option value="pt">PT</option>
    </select>
  );
}
