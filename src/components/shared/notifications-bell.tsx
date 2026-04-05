'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/notifications-bell.module.css';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  type Notification,
} from '@/actions/notification-actions';

interface NotificationsBellProps {
  variant?: 'admin' | 'user';
}

export default function NotificationsBell({
  variant = 'admin',
}: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', onDocClick);
    }

    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    async function loadNotifications() {
      setLoading(true);
      try {
        const notifications = await fetchNotifications();
        if (!mounted) return;
        setItems(notifications);
      } catch (err) {
        if (!mounted) return;
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [open]);

  // fetch unread count (on mount) and keep it updated (poll + focus)
  useEffect(() => {
    let mounted = true;

    async function fetchUnread() {
      try {
        const count = await fetchUnreadCount();
        if (!mounted) return;
        setUnreadCount(Number(count ?? 0));
      } catch {
        /* ignore */
      }
    }

    fetchUnread();

    const interval = setInterval(fetchUnread, 30_000);

    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const variantClass =
    variant === 'admin' ? styles.variantAdmin : styles.variantUser;
  const unreadCountFinal = unreadCount || items.filter(i => !i.read_at).length;

  return (
    <div className={`${styles.container} ${variantClass}`} ref={containerRef}>
      <button
        type="button"
        aria-label={
          unreadCountFinal > 0
            ? `View inbox (${unreadCountFinal} unread)`
            : 'View inbox'
        }
        onClick={() => setOpen(v => !v)}
        className={`${styles.bellButton} ${unreadCountFinal > 0 ? styles.unreadPulse : ''}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 002-2H8a2 2 0 002 2z" />
        </svg>
      </button>

      <div
        className={`${styles.panel} ${open ? styles.open : ''}`}
        style={{
          transform: open
            ? 'scale(1) translateY(0)'
            : 'scale(0.95) translateY(-8px)',
        }}
      >
        <div className={styles.header}>
          <div className="font-bold">Inbox</div>
          <button
            type="button"
            onClick={async () => {
              try {
                await markAllAsRead();
                setItems([]);
                setUnreadCount(0);
              } catch {
                /* ignore */
              }
            }}
            className={styles.clearButton}
          >
            Clear
          </button>
        </div>

        <div className={`${styles.contentArea} custom-scrollbar`}>
          {loading ? (
            <div className={styles.loadingState}>Loading...</div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>No notifications</div>
          ) : (
            <ul className={styles.notificationList}>
              {items.map(n => (
                <li key={n.id} className={styles.notificationItem}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div
                        className={`${styles.msgTitle} font-semibold text-sm truncate`}
                      >
                        {n.message_title}
                      </div>
                      <div
                        className={`${styles.msgBody} text-xs truncate mt-1`}
                      >
                        {n.message_body}
                      </div>
                    </div>
                    <div
                      className={`${styles.msgTime} text-[11px] ml-2 whitespace-nowrap`}
                    >
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
