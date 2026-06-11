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
            style={{
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              fontSize: '0.75rem',
              color: 'var(--color-accent)',
            }}
          >
            ▼
          </span>
          {title}
        </h3>
        {headerRight && (
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
            {headerRight}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className={styles.panelContent} style={{ marginTop: '12px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
