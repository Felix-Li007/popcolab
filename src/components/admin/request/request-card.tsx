import { REQUEST_STATUS } from '@/constants/request-status';
import type { AdminRequestListItem } from '@/types/request-type';
import { Badge } from '@/ui';
import styles from '@/styles/admin/requests/request-card.module.css';

type Props = {
  request: AdminRequestListItem;
  onView: (request: AdminRequestListItem) => void;
};

function getStatusBadge(status: AdminRequestListItem['status']) {
  switch (status) {
    case REQUEST_STATUS.OPENED:
      return { label: 'Opened', variant: 'secondary' as const };
    case REQUEST_STATUS.PENDING:
      return { label: 'Pending', variant: 'warning' as const };
    case REQUEST_STATUS.MATCHED:
      return { label: 'Matched', variant: 'success' as const };
    case REQUEST_STATUS.CLOSED:
      return { label: 'Closed', variant: 'danger' as const };
    default:
      return { label: status, variant: 'default' as const };
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatBudget(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  if (min !== null && max !== null) {
    return `${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  return (min ?? max ?? 0).toLocaleString();
}

export default function RequestCard({ request, onView }: Readonly<Props>) {
  const status = getStatusBadge(request.status);

  return (
    <article className={styles.card} data-testid="admin-request-card">
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Request #{request.id}</p>
          <p className={styles.subtitle}>{request.user.displayName}</p>
        </div>
        <Badge size="xs" variant={status.variant}>
          {status.label}
        </Badge>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Objective</p>
          <p className={styles.metaValue}>{request.objectiveCategory}</p>
        </div>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Email</p>
          <p className={styles.metaValue}>{request.user.email}</p>
        </div>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Participants</p>
          <p className={styles.metaValue}>{request.participantCount ?? '—'}</p>
        </div>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Budget</p>
          <p className={styles.metaValue}>
            {formatBudget(request.budgetMin, request.budgetMax)}
          </p>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <span>Invites: {request.inviteSummary.total}</span>
        <span>Proposals: {request.proposalSummary.total}</span>
        <span>Created: {formatDate(request.createdAt)}</span>
      </div>

      <button
        type="button"
        onClick={() => onView(request)}
        className={styles.viewButton}
        data-testid="admin-request-view"
      >
        View Details
      </button>
    </article>
  );
}
