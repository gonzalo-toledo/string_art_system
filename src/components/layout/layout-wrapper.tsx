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

  // Ocultar cabecera y pie de página en:
  // 1. La intro / splash screen (ej: "/es", "/en", "/pt" o "/")
  // 2. La pantalla del guiado (ej: "/es/guide", "/en/guide", etc.)
  const isSplash = pathname === `/${locale}` || pathname === '/' || pathname === `/${locale}/`;
  const isGuide = pathname ? pathname.endsWith('/guide') || pathname.endsWith('/guide/') : false;
  
  const showHeaderFooter = !isSplash && !isGuide;

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
