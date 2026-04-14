'use client';

import Link from 'next/link';
import { REQUEST_STATUS } from '@/constants/request-status';
import type { AdminRequestListItem } from '@/types/request-type';
import { Badge } from '@/ui';
import styles from '@/styles/admin/requests/request-detail.module.css';

type Props = {
  request: AdminRequestListItem;
  backHref: string;
};

function getStatusBadge(status: AdminRequestListItem['status']) {
  switch (status) {
    case REQUEST_STATUS.OPENED:
      return { label: 'OPENED', variant: 'secondary' as const };
    case REQUEST_STATUS.PENDING:
      return { label: 'PENDING', variant: 'warning' as const };
    case REQUEST_STATUS.MATCHED:
      return { label: 'MATCHED', variant: 'success' as const };
    case REQUEST_STATUS.CLOSED:
      return { label: 'CLOSED', variant: 'danger' as const };
    default:
      return { label: status, variant: 'default' as const };
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function renderText(value: string | null | undefined): string {
  if (!value) return '—';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '—';
}

function formatBudget(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  if (min !== null && max !== null) {
    return `${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  return (min ?? max ?? 0).toLocaleString();
}

function splitDesiredValues(value: string | null | undefined): string[] {
  if (!value) return [];

  const normalized = value.trim();
  if (!normalized) return [];

  if (!normalized.includes(',')) {
    return [normalized];
  }

  return normalized
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

export default function RequestDetail({ request, backHref }: Readonly<Props>) {
  const status = getStatusBadge(request.status);
  const preferenceCount = request.requestPreferences.length;

  return (
    <div className={styles.root} data-testid="admin-request-detail-page">
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Request #{request.id}</h1>
            <p className={styles.subtitle}>{request.user.email}</p>
          </div>
          <div className={styles.headerActions}>
            <Badge size="xs" variant={status.variant}>
              {status.label}
            </Badge>
            <Link href={backHref} className={styles.backLink}>
              Back to List
            </Link>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.content}>
            <section className={styles.sectionCard}>
              <p className={styles.sectionTitle}>Request Overview</p>
              <div className={styles.requestGrid}>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Objective</p>
                  <p className={styles.infoValue}>
                    {request.objectiveCategory}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Delivery</p>
                  <p className={styles.infoValue}>
                    {renderText(request.deliveryMethod)}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Budget</p>
                  <p className={styles.infoValue}>
                    {formatBudget(request.budgetMin, request.budgetMax)}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Participants</p>
                  <p className={styles.infoValue}>
                    {request.participantCount ?? '—'}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Duration Max</p>
                  <p className={styles.infoValue}>
                    {request.durationMax ?? '—'}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Constraint</p>
                  <p className={styles.infoValue}>{request.constraintMode}</p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Preferred Date</p>
                  <p className={styles.infoValue}>
                    {formatDate(request.preferredDate)}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Expired At</p>
                  <p className={styles.infoValue}>
                    {formatDate(request.expiredAt)}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Created At</p>
                  <p className={styles.infoValue}>
                    {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
              <div className={styles.notesCard}>
                <p className={styles.sectionTitle}>Notes For Admin</p>
                <p className={styles.notesText}>
                  {renderText(request.notesForAdmin)}
                </p>
              </div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.preferenceHeader}>
                <p className={styles.sectionTitle}>Request Preference</p>
                <span className={styles.preferenceCount}>
                  {preferenceCount}{' '}
                  {preferenceCount === 1 ? 'Question' : 'Questions'}
                </span>
              </div>

              {preferenceCount === 0 ? (
                <p className={styles.emptyText}>No request preferences.</p>
              ) : (
                <div className={styles.preferenceList}>
                  {request.requestPreferences.map((preference, index) => {
                    const answerText =
                      preference.optionLabel?.trim() || preference.desiredValue;
                    const desiredValues = splitDesiredValues(answerText);

                    return (
                      <div
                        key={preference.id}
                        className={styles.preferenceCard}
                      >
                        <div className={styles.preferenceQuestionRow}>
                          <span className={styles.preferenceIndex}>
                            {index + 1}
                          </span>
                          <p className={styles.preferenceQuestion}>
                            {renderText(preference.questionText)}
                          </p>
                        </div>
                        <div className={styles.preferenceAnswerBlock}>
                          <p className={styles.preferenceAnswerLabel}>Answer</p>
                          {desiredValues.length > 1 ? (
                            <div className={styles.preferenceAnswerChips}>
                              {desiredValues.map(value => (
                                <span
                                  key={`${preference.id}-${value}`}
                                  className={styles.preferenceAnswerChip}
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className={styles.preferenceAnswer}>
                              {renderText(answerText)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
