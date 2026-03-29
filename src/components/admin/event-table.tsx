'use client';

import Link from 'next/link';
import type { OverviewEventSummaryItem } from '@/types/overview-type';
import styles from '@/styles/admin/event-table.module.css';

const statusConfig: Record<
  OverviewEventSummaryItem['status'],
  { label: string; className: string }
> = {
  live: {
    label: 'Live',
    className: styles.statusLive,
  },
  upcoming: {
    label: 'Upcoming',
    className: styles.statusUpcoming,
  },
};

export default function EventTable({
  events,
  onView,
}: Readonly<{
  events: OverviewEventSummaryItem[];
  onView: (id: number) => void;
}>) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.emoji}>📅</span>
          <h2 className={styles.title}>Current Events</h2>
        </div>
        <Link href="/admin/events" className={styles.viewAllLink}>
          View all →
        </Link>
      </div>

      <div className={styles.tableShell}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.tableHeadCell}>Title</th>
                <th className={styles.tableHeadCell}>Date</th>
                <th className={styles.tableHeadCell}>Location</th>
                <th className={styles.tableHeadCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    No active or upcoming events right now.
                  </td>
                </tr>
              ) : (
                events.map(event => {
                  const status = statusConfig[event.status];

                  return (
                    <tr
                      key={`${event.id}-${event.dateLabel}`}
                      className={styles.tableRow}
                    >
                      <td className={styles.titleCell}>
                        <button
                          type="button"
                          onClick={() => onView(event.id)}
                          className={styles.titleButton}
                        >
                          {event.title}
                        </button>
                      </td>
                      <td className={styles.bodyCell}>{event.dateLabel}</td>
                      <td className={styles.bodyCell}>{event.location}</td>
                      <td className={styles.bodyCell}>
                        <span
                          className={`${styles.statusBadge} ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
