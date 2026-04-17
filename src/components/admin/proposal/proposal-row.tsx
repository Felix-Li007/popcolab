'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { approveAdminProposalAction } from '@/actions/proposal-actions';
import { deleteAdminProposalAction } from '@/actions/proposal-actions';
import { Badge } from '@/ui';
import ProposalExperience from '@/components/admin/proposal/proposal-experience';
import type { ProposalRowView } from '@/types/proposal-row.types';
import styles from '@/styles/admin/proposals/proposal-row.module.css';

type Props = {
  row: ProposalRowView;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatPriceValue(value: number | null): string {
  if (value === null) return '-';
  return value.toLocaleString();
}

function formatBudgetRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '-';
  return `${formatPriceValue(min)} - ${formatPriceValue(max)}`;
}

function getStatusBadge(
  status: 'pending' | 'approved' | 'accepted' | 'rejected'
) {
  switch (status) {
    case 'pending':
      return { label: 'PENDING', variant: 'warning' as const };
    case 'approved':
      return { label: 'APPROVED', variant: 'success' as const };
    case 'accepted':
      return { label: 'ACCEPTED', variant: 'success' as const };
    case 'rejected':
      return { label: 'REJECTED', variant: 'danger' as const };
    default:
      return {
        label: String(status).toUpperCase(),
        variant: 'default' as const,
      };
  }
}

export default function ProposalRow({ row }: Readonly<Props>) {
  const router = useRouter();
  const [isApproving, startApproveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const status = getStatusBadge(row.proposal.status);
  const canOperate =
    row.proposal.status !== 'accepted' && row.proposal.status !== 'approved';
  const finalScores = row.proposal.experiences.map(
    experience => experience.baseScore + experience.riskAdjustment
  );
  const bestScore = finalScores.length > 0 ? Math.max(...finalScores) : null;
  const avgScore =
    finalScores.length > 0
      ? finalScores.reduce((sum, current) => sum + current, 0) /
        finalScores.length
      : null;

  function handleDelete() {
    if (!canOperate || isDeleting) return;

    if (
      !confirm(`Delete proposal #${row.proposal.id}? This cannot be undone.`)
    ) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteAdminProposalAction(row.proposal.id);

      if (!result.ok) {
        alert(result.message);
        return;
      }

      router.refresh();
    });
  }

  function handleApprove() {
    if (!canOperate || isApproving) return;

    startApproveTransition(async () => {
      const result = await approveAdminProposalAction(row.proposal.id);

      if (!result.ok) {
        alert(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <article
      key={`${row.request.requestId}-${row.proposal.id}`}
      className={styles.proposalRow}
      data-testid="admin-proposal-row"
    >
      <div className={styles.proposalSummary}>
        <div className={styles.proposalInfoHead}>
          <div className={styles.proposalTitleGroup}>
            <p className={styles.proposalTitle}>Proposal #{row.proposal.id}</p>
            <p className={styles.proposalSubTitle}>
              <Link
                href={`/admin/requests/${row.request.requestId}`}
                className={styles.requestInlineLink}
              >
                Request #{row.request.requestId}
              </Link>{' '}
              · {row.proposal.experiences.length} experiences
            </p>
          </div>
          <Badge size="xs" variant={status.variant}>
            {status.label}
          </Badge>
        </div>

        <div className={styles.proposalSummaryGrid}>
          <div className={styles.infoBlock}>
            <p className={styles.infoText}>
              Objective Alignment: {row.proposal.objectiveAlignment || '-'}
            </p>
          </div>

          <div className={styles.infoBlock}>
            <p className={styles.infoLabel}>
              Created {formatDateTime(row.proposal.createdAt)}
            </p>
            <p className={styles.infoText}>
              Updated {formatDateTime(row.proposal.updatedAt)}
            </p>
          </div>
        </div>

        <div className={styles.keyMetricStrip}>
          <div className={styles.keyMetricCard}>
            <p className={styles.keyMetricLabel}>Best Match</p>
            <p className={styles.keyMetricValue}>
              {bestScore === null ? '-' : bestScore.toFixed(2)}
            </p>
          </div>
          <div className={styles.keyMetricCard}>
            <p className={styles.keyMetricLabel}>Avg Match</p>
            <p className={styles.keyMetricValue}>
              {avgScore === null ? '-' : avgScore.toFixed(2)}
            </p>
          </div>
          <div className={styles.keyMetricCard}>
            <p className={styles.keyMetricLabel}>Budget</p>
            <p className={styles.keyMetricValueCompact}>
              {formatBudgetRange(
                row.request.requestBudgetMin,
                row.request.requestBudgetMax
              )}
            </p>
          </div>
          <div className={styles.keyMetricCard}>
            <p className={styles.keyMetricLabel}>Preferences</p>
            <p className={styles.keyMetricValue}>
              {row.request.requestPreferenceCount}
            </p>
          </div>
        </div>

        {row.proposal.rejectNotes ? (
          <div className={styles.rejectNotesCallout}>
            <p className={styles.rejectNotesLabel}>Reject Notes</p>
            <p className={styles.rejectNotesText}>{row.proposal.rejectNotes}</p>
          </div>
        ) : null}

        <div className={styles.actionRow}>
          {canOperate ? (
            <>
              <button
                type="button"
                className={styles.acceptButton}
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? 'Approving...' : 'Approve'}
              </button>
              <Link
                href={`/admin/proposals/${row.proposal.id}/edit`}
                className={styles.regenerateButton}
              >
                Edit
              </Link>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          ) : (
            <>
              <span
                className={`${styles.acceptButton} ${styles.actionButtonDisabled}`}
                aria-disabled="true"
              >
                Approve
              </span>
              <span
                className={`${styles.regenerateButton} ${styles.actionButtonDisabled}`}
                aria-disabled="true"
              >
                Edit
              </span>
              <span
                className={`${styles.deleteButton} ${styles.actionButtonDisabled}`}
                aria-disabled="true"
              >
                Delete
              </span>
            </>
          )}
        </div>
      </div>

      <ProposalExperience
        proposalId={row.proposal.id}
        experiences={row.proposal.experiences}
      />
    </article>
  );
}
