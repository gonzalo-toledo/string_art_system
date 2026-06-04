"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import AppHeader from './app-header';
import AppFooter from './app-footer';

interface LayoutWrapperProps {
  children: React.ReactNode;
  locale: string;
}

export default function LayoutWrapper({ children, locale }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Ocultar cabecera y pie de página solo en la intro / splash screen
  const isSplash = pathname === `/${locale}` || pathname === '/' || pathname === `/${locale}/`;
  
  const showHeaderFooter = !isSplash;

  return (
    <>
      {showHeaderFooter && <AppHeader locale={locale} />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      {showHeaderFooter && <AppFooter />}
    </>
  );
}
