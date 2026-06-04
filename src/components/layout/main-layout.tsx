"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import AppHeader from './app-header';
import AppFooter from './app-footer';
import styles from './main-layout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
  locale: string;
}

/**
 * Layout principal de la aplicación.
 * Envuelve todas las páginas con el mismo header (logo + idioma) y footer (CODEVA).
 * Solo oculta navbar/footer en el splash screen (/es, /en, /pt o /).
 * Editor y Modo Guiado comparten exactamente el mismo marco visual.
 */
export default function MainLayout({ children, locale }: MainLayoutProps) {
  const pathname = usePathname();

  const isSplash = pathname === `/${locale}` || pathname === '/' || pathname === `/${locale}/`;
  const showHeaderFooter = !isSplash;

  return (
    <div className={styles.layout}>
      {showHeaderFooter && <AppHeader locale={locale} />}
      <main className={styles.main}>
        {children}
      </main>
      {showHeaderFooter && <AppFooter />}
    </div>
  );
}
