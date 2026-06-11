"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './app-header.module.css';

// Banderas SVG simplificadas y vectoriales, diseñadas para lucir perfectas en formato redondo (tipo moneda)
export function FlagAR(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" {...props}>
      <rect fill="#74acdf" width="9" height="6"/>
      <rect fill="#ffffff" y="2" width="9" height="2"/>
      <circle fill="#f6b426" cx="4.5" cy="3" r="0.65"/>
    </svg>
  );
}

export function FlagUS(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 10" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" {...props}>
      <rect fill="#b22234" width="19" height="10"/>
      <path d="M0,0.77h19M0,2.3h19M0,3.85h19M0,5.38h19M0,6.92h19M0,8.46h19" stroke="#ffffff" strokeWidth="0.77"/>
      <rect fill="#3c3b6e" width="7.6" height="5.38"/>
      <circle fill="#fff" cx="1.8" cy="1.3" r="0.35"/>
      <circle fill="#fff" cx="5.8" cy="1.3" r="0.35"/>
      <circle fill="#fff" cx="3.8" cy="2.7" r="0.35"/>
      <circle fill="#fff" cx="1.8" cy="4.1" r="0.35"/>
      <circle fill="#fff" cx="5.8" cy="4.1" r="0.35"/>
    </svg>
  );
}

export function FlagBR(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 7" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" {...props}>
      <rect fill="#009c3b" width="10" height="7"/>
      <polygon fill="#ffdf00" points="5,0.6 9,3.5 5,6.4 1,3.5"/>
      <circle fill="#002171" cx="5" cy="3.5" r="1.5"/>
      <path fill="#ffffff" d="M3.7,3.9 C 4.5,3.3 5.5,3.3 6.3,3.9 C 6.3,3.7 4.5,3.1 3.7,3.9" />
    </svg>
  );
}

export function ChevronDown({ size = 16, strokeWidth = 2, ...props }: React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type LanguageSelectorProps = {
  currentLocale: string;
};

type LanguageOption = {
  code: string;
  name: string;
  flag: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Español', flag: FlagAR },
  { code: 'en', name: 'English', flag: FlagUS },
  { code: 'pt', name: 'Português', flag: FlagBR }
];

export default function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGES.find(l => l.code === currentLocale) || LANGUAGES[0];
  const ActiveFlag = activeLang.flag;

  const handleLocaleChange = (newLocale: string) => {
    setIsOpen(false);
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/[a-z]{2}/, `/${newLocale}`);
    router.push(newPath);
  };

  // Cierra el menú al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.langSelectorContainer} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.langSelectorTrigger}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.flagWrapper}>
          <ActiveFlag />
        </div>
        <span className={styles.langCode}>{activeLang.code.toUpperCase()}</span>
        <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>

      {isOpen && (
        <ul className={styles.langSelectorDropdown} role="listbox">
          {LANGUAGES.map((lang) => {
            const Flag = lang.flag;
            const isSelected = lang.code === currentLocale;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleLocaleChange(lang.code)}
                className={`${styles.langOption} ${isSelected ? styles.langOptionSelected : ''}`}
              >
                <div className={styles.flagWrapper}>
                  <Flag />
                </div>
                <span className={styles.langName}>{lang.name}</span>
                {isSelected && <span className={styles.selectedIndicator}>✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
