'use client';

import ModalShell from '@/components/shared/modal-shell';
import type { AdminRequestListItem } from '@/types/request-type';
import { Badge } from '@/ui';
import styles from '@/styles/admin/requests/request-users.module.css';

type Props = {
  request: AdminRequestListItem | null;
  isOpen: boolean;
  onClose: () => void;
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function getInviteBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'accepted')
    return { label: 'Accepted', variant: 'success' as const };
  if (normalized === 'rejected')
    return { label: 'Rejected', variant: 'danger' as const };
  return { label: 'Pending', variant: 'default' as const };
}

export default function RequestUsers({
  request,
  isOpen,
  onClose,
}: Readonly<Props>) {
  if (!isOpen || !request) return null;

  const acceptedCount = request.invitedUsers.filter(
    invite => invite.invitedStatus.toLowerCase() === 'accepted'
  ).length;
  const rejectedCount = request.invitedUsers.filter(
    invite => invite.invitedStatus.toLowerCase() === 'rejected'
  ).length;
  const pendingCount =
    request.invitedUsers.length - acceptedCount - rejectedCount;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Invited Users · Request #${request.id}`}
      subtitle={`${request.inviteSummary.total} invited user(s)`}
      rootTestId="admin-request-users-root"
      panelTestId="admin-request-users-modal"
      bodyClassName={styles.modalBodyBg}
    >
      <div className={styles.body} data-testid="admin-request-users-body">
        <section className={styles.summaryGrid}>
          <article className={`${styles.summaryCard} ${styles.acceptedCard}`}>
            <p className={`${styles.summaryCardTitle} ${styles.acceptedTitle}`}>
              Accepted
            </p>
            <p className={`${styles.summaryCardValue} ${styles.acceptedValue}`}>
              {acceptedCount}
            </p>
          </article>
          <article className={`${styles.summaryCard} ${styles.pendingCard}`}>
            <p className={`${styles.summaryCardTitle} ${styles.pendingTitle}`}>
              Pending
            </p>
            <p className={`${styles.summaryCardValue} ${styles.pendingValue}`}>
              {pendingCount}
            </p>
          </article>
          <article className={`${styles.summaryCard} ${styles.rejectedCard}`}>
            <p className={`${styles.summaryCardTitle} ${styles.rejectedTitle}`}>
              Rejected
            </p>
            <p className={`${styles.summaryCardValue} ${styles.rejectedValue}`}>
              {rejectedCount}
            </p>
          </article>
        </section>

        {request.invitedUsers.length === 0 ? (
          <article className={styles.emptyState}>
            <p className={styles.emptyStateTitle}>No invited users yet</p>
            <p className={styles.emptyStateText}>
              Once users are invited, they will appear here with response
              details.
            </p>
          </article>
        ) : (
          <div className={styles.listScroll}>
            {request.invitedUsers.map(invite => {
              const badge = getInviteBadge(invite.invitedStatus);
              const nameInitial =
                invite.userName?.trim().charAt(0).toUpperCase() || '?';

              return (
                <article key={invite.id} className={styles.userCard}>
                  <div className={styles.userHeader}>
                    <div className={styles.userInfo}>
                      <span className={styles.userAvatar}>{nameInitial}</span>
                      <div>
                        <p className={styles.userName}>{invite.userName}</p>
                        <p className={styles.userEmail}>{invite.userEmail}</p>
                      </div>
                    </div>
                    <Badge size="xs" variant={badge.variant}>
                      {badge.label}
                    </Badge>
                  </div>

                  <dl className={styles.metaGrid}>
                    <div>
                      <dt className={styles.metaLabel}>Invited</dt>
                      <dd className={styles.metaValue}>
                        {formatDate(invite.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className={styles.metaLabel}>Responded</dt>
                      <dd className={styles.metaValue}>
                        {formatDate(invite.respondAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className={styles.metaLabel}>Expired</dt>
                      <dd className={styles.metaValue}>
                        {formatDate(invite.expiredAt)}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
