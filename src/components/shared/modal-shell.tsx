'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/modal-shell.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  headerMeta?: ReactNode;
  children: ReactNode;
  rootTestId?: string;
  panelTestId?: string;
  bodyTestId?: string;
  panelClassName?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
  showHeader?: boolean;
};

function buildClassName(
  baseClassName: string,
  extraClassName?: string
): string {
  return extraClassName ? `${baseClassName} ${extraClassName}` : baseClassName;
}

export default function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  headerMeta,
  children,
  rootTestId,
  panelTestId,
  bodyTestId,
  panelClassName,
  bodyClassName,
  showCloseButton = true,
  showHeader = true,
}: Readonly<Props>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div className={styles.root} data-testid={rootTestId}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div
        className={buildClassName(styles.panel, panelClassName)}
        data-testid={panelTestId}
      >
        {showHeader ? (
          <div className={styles.header}>
            <div className={styles.headerIdentity}>
              <div className={styles.titleRow}>
                <h3 className={styles.title}>{title}</h3>
                {headerMeta}
              </div>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>

            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close"
              >
                ✕
              </button>
            ) : null}
          </div>
        ) : null}

        {!showHeader && showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className={`${styles.closeButton} ${styles.floatingCloseButton}`}
            aria-label="Close"
          >
            ✕
          </button>
        ) : null}

        <div
          className={buildClassName(styles.body, bodyClassName)}
          data-testid={bodyTestId}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
