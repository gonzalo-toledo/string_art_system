"use client";
import React, { useState } from 'react';
import styles from './editor.module.css';

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
}

/**
 * Panel colapsable genérico para el editor.
 * Renderiza una cabecera cliqueable con indicador de flecha (chevron)
 * que colapsa/expande el contenido inferior.
 */
export function CollapsiblePanel({ title, children, defaultOpen = true, headerRight }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${styles.panel} ${!isOpen ? styles.panelCollapsed : ''}`}>
      <div
        className={styles.panelHeader}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <h3 className={styles.panelHeaderTitle}>
          <span
            className={styles.panelChevron}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              color: 'var(--color-accent)',
              width: '12px',
              height: '12px',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
          {title}
        </h3>
        {headerRight && (
          <div className={styles.panelHeaderRight} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
            {headerRight}
          </div>
        )}
      </div>
      
      <div className={`${styles.panelContent} ${!isOpen ? styles.panelContentCollapsed : ''}`} style={{ marginTop: '12px' }}>
        {children}
      </div>
    </div>
  );
}
