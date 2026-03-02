'use client';

import { USER_STATUS_BADGE } from '@/constants/user-status';
import type { AdminUserListItem } from '@/types/user-type';
import ModalShell from '@/components/shared/modal-shell';
import { Badge } from '@/ui';
import styles from '@/styles/user-view.module.css';

type Props = {
  user: AdminUserListItem | null;
  isOpen: boolean;
  onClose: () => void;
};

function getUserName(user: AdminUserListItem): string {
  return user.userName.trim() || 'No username';
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function renderValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '—';
}

function getAvatarText(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '?';
  return normalized.slice(0, 1).toUpperCase();
}

export default function UserViewModal({ user, isOpen, onClose }: Props) {
  if (!isOpen || !user) return null;

  const statusBadge = USER_STATUS_BADGE[user.status];
  const userName = getUserName(user);
  const avatarText = getAvatarText(userName);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={userName}
      subtitle={user.email}
      headerMeta={
        <Badge size="xs" variant={statusBadge.variant}>
          {statusBadge.label}
        </Badge>
      }
      rootTestId="user-detail-modal-root"
      panelTestId="user-detail-modal"
    >
      <div className={styles.content} data-testid="user-detail-view-body">
        <div className={styles.grid}>
          <div className={`${styles.infoCard} ${styles.tile1}`}>
            <p className={styles.label}>Avatar</p>
            <div className={styles.avatarCenter}>
              <div className={styles.avatarPlaceholder} aria-hidden="true">
                {avatarText}
              </div>
            </div>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.label}>First Name</p>
            <p className={styles.value}>{renderValue(user.firstName)}</p>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.label}>Last Name</p>
            <p className={styles.value}>{renderValue(user.lastName)}</p>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.label}>Phone</p>
            <p className={styles.value}>{renderValue(user.phoneNumber)}</p>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.label}>Preferred Contact</p>
            <p className={styles.value}>{renderValue(user.preferredContact)}</p>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.label}>Requests</p>
            <p className={styles.value}>{user.requestCount}</p>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.label}>Consent Given</p>
            <p className={styles.value}>
              {user.consentGiven === null
                ? '—'
                : user.consentGiven
                  ? 'Yes'
                  : 'No'}
            </p>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.label}>Created At</p>
            <p className={styles.value}>{formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div>
          <p className={styles.sectionTitle}>Corporate</p>
          <div className={styles.sectionCard}>
            <div className={styles.corporateGrid}>
              <div className={styles.corporateItem}>
                <p className={styles.corporateLabel}>Company</p>
                <p className={styles.corporateValue}>
                  {renderValue(user.corporateName)}
                </p>
              </div>
              <div className={styles.corporateItem}>
                <p className={styles.corporateLabel}>Department</p>
                <p className={styles.corporateValue}>
                  {renderValue(user.departmentName)}
                </p>
              </div>
              <div className={styles.corporateItem}>
                <p className={styles.corporateLabel}>Role</p>
                <p className={styles.corporateValue}>
                  {renderValue(user.roleTitle)}
                </p>
              </div>
              <div className={styles.corporateItem}>
                <p className={styles.corporateLabel}>Work Mode</p>
                <p className={styles.corporateValue}>
                  {renderValue(user.workMode)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className={styles.sectionTitle}>Teams({user.teamCount})</p>
          <div className={styles.sectionCard}>
            {user.teamNames.length === 0 ? (
              <p className={styles.emptyText}>No teams owned.</p>
            ) : (
              <div className={styles.teamChips}>
                {user.teamNames.map(teamName => (
                  <Badge key={teamName} size="xs" variant="default">
                    {teamName}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className={styles.sectionTitle}>Privacy Notes</p>
          <div className={`${styles.infoCard} ${styles.privacyCard}`}>
            <p className={styles.privacyText}>
              {renderValue(user.privacyNotes)}
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
