import { USER_STATUS_BADGE } from '@/constants/user-status';
import type { AdminUserListItem } from '@/types/user-type';
import { Badge } from '@/ui';
import styles from '@/styles/user-card.module.css';

type Props = {
  user: AdminUserListItem;
  onViewDetails: (user: AdminUserListItem) => void;
  onEdit?: (user: AdminUserListItem) => void;
};

function EditIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function ViewIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function MailIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function displayValue(value: string | null | undefined): string {
  return hasText(value) ? value!.trim() : '—';
}

function getStatusBadge(status: AdminUserListItem['status']) {
  return USER_STATUS_BADGE[status];
}

export default function UserCard({ user, onViewDetails, onEdit }: Props) {
  const status = getStatusBadge(user.status);
  const avatarText = user.userName.slice(0, 1).toUpperCase() || '?';
  const hasCompanyInfo =
    hasText(user.corporateName) ||
    hasText(user.departmentName) ||
    hasText(user.roleTitle) ||
    hasText(user.workMode);
  const companyFields = [
    { label: 'Company', value: user.corporateName },
    { label: 'Department', value: user.departmentName },
    { label: 'Role', value: user.roleTitle },
    { label: 'Work Mode', value: user.workMode },
  ];

  return (
    <article className={styles.card} data-testid="user-card">
      <div className={styles.orb} aria-hidden="true" />

      <div className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{avatarText}</div>
          <div className={styles.identityText}>
            <p className={styles.userName}>{user.userName}</p>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>
        <Badge size="xs" variant={status.variant}>
          {status.label}
        </Badge>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Teams</p>
          <p className={styles.statValue}>{user.teamCount}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Requests</p>
          <p className={styles.statValue}>{user.requestCount}</p>
        </div>
      </div>

      {hasCompanyInfo ? (
        <div className={styles.companyMetaPanel}>
          {companyFields.map(field => (
            <div key={field.label} className={styles.companyMetaItem}>
              <p className={styles.companyMetaLabel}>{field.label}</p>
              <p className={styles.companyMetaValue}>
                {displayValue(field.value)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.companyMetaEmptyWrap}>
          <p className={styles.companyMetaEmpty}>No company</p>
        </div>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          onClick={() => {
            if (onEdit) {
              onEdit(user);
              return;
            }
            onViewDetails(user);
          }}
          className={styles.actionTertiary}
          data-testid="user-card-edit"
        >
          <EditIcon className={styles.actionIcon} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onViewDetails(user)}
          className={styles.actionPrimary}
          data-testid="user-card-view"
        >
          <ViewIcon className={styles.actionIcon} />
          View
        </button>
        <a
          href={`mailto:${user.email}`}
          className={styles.actionSecondary}
          data-testid="user-card-email"
        >
          <MailIcon className={styles.actionIcon} />
          Email
        </a>
      </div>
    </article>
  );
}
