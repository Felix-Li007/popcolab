'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { acceptProposalAction } from '@/actions/request-actions';
import RejectProposalModal from '@/components/requests/reject-proposal-modal';
import type { UserProposalDetail } from '@/services/user-proposal-service';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Awaiting Review',
    className: 'bg-amber-100 text-amber-700',
  },
  approved: {
    label: 'Ready for You',
    className: 'bg-emerald-100 text-emerald-700',
  },
  accepted: { label: 'Accepted', className: 'bg-violet-100 text-violet-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-600' },
};

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(value: number | null): string {
  if (value === null) return '—';
  return `$${value.toLocaleString()}`;
}

function formatDuration(min: number, max: number): string {
  if (min <= 0 && max <= 0) return '—';
  if (min <= 0) return `${max}m`;
  if (max <= 0) return `${min}m`;
  return `${min}–${max}m`;
}

type Props = {
  proposal: UserProposalDetail;
};

export default function UserProposalDetailContent({ proposal }: Props) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [accepting, startAccept] = useTransition();

  const status = STATUS_MAP[proposal.status] ?? {
    label: proposal.status,
    className: 'bg-gray-100 text-gray-600',
  };

  const isApproved = proposal.status === 'approved';

  function handleAccept() {
    startAccept(async () => {
      await acceptProposalAction(proposal.id);
    });
  }

  return (
    <>
      {/* Back link */}
      <Link
        href="/dashboard/proposals"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Back to Proposals
      </Link>

      {/* Header */}
      <div className="dashboard-glass-panel px-5 py-5 sm:px-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="dashboard-section-eyebrow">Proposal #{proposal.id}</p>
            <h1 className="dashboard-section-title mt-1">
              {proposal.request.objectiveCategory}
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Request #{proposal.requestId} · Created{' '}
              {formatDate(proposal.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Objective alignment */}
        {proposal.objectiveAlignment && (
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              Objective Alignment
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {proposal.objectiveAlignment}
            </p>
          </div>
        )}
      </div>

      {/* Request summary */}
      <div className="dashboard-glass-panel px-5 py-4 sm:px-6 mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
          Your Request Details
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              Preferred Date
            </span>
            <span className="text-xs font-medium text-gray-700">
              {formatDate(proposal.request.preferredDate)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              Participants
            </span>
            <span className="text-xs font-medium text-gray-700">
              {proposal.request.participantCount
                ? `${proposal.request.participantCount} people`
                : '—'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              Budget Min
            </span>
            <span className="text-xs font-medium text-gray-700">
              {formatPrice(proposal.request.budgetMin)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              Budget Max
            </span>
            <span className="text-xs font-medium text-gray-700">
              {formatPrice(proposal.request.budgetMax)}
            </span>
          </div>
        </div>
      </div>

      {/* Experiences */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 px-1">
          Proposed Experiences ({proposal.experiences.length})
        </p>
        <div className="flex flex-col gap-4">
          {proposal.experiences.map((exp, index) => {
            const finalScore = exp.baseScore + exp.riskAdjustment;
            const scoreTone =
              finalScore >= 0.8 ? 'high' : finalScore >= 0.5 ? 'medium' : 'low';

            return (
              <div
                key={exp.id}
                className="dashboard-glass-panel px-5 py-4 sm:px-6"
              >
                {/* Experience header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Option {index + 1}
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {exp.title}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      scoreTone === 'high'
                        ? 'bg-emerald-100 text-emerald-700'
                        : scoreTone === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                    }`}
                  >
                    Score {finalScore.toFixed(2)}
                  </span>
                </div>

                {/* Rationale */}
                {exp.rationale && (
                  <div className="mb-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-amber-700 mb-1">
                      Why this was selected
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      {exp.rationale}
                    </p>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Duration
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {formatDuration(exp.durationMin, exp.durationMax)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Capacity
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {exp.capacityMax > 0 ? `Up to ${exp.capacityMax}` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Starting Price
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {formatPrice(exp.startingPrice)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Add-on Price
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {formatPrice(exp.addingPrice)}
                    </span>
                  </div>
                  <div className="flex flex-col col-span-2 sm:col-span-4">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Delivery Methods
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {exp.deliveryMethods || '—'}
                    </span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3">
                  <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-semibold">
                    Base {exp.baseScore.toFixed(2)}
                  </span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-semibold">
                    Risk adjustment {exp.riskAdjustment.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar — only visible when approved */}
      {isApproved && (
        <div className="dashboard-glass-panel px-5 py-4 sm:px-6">
          <p className="text-xs font-bold text-gray-700 mb-1">
            Ready to decide?
          </p>
          <p className="text-[11px] text-gray-500 mb-4">
            Accept this proposal to move forward, or reject it with feedback so
            admin can revise.
          </p>
          <div className="flex gap-3">
            <button
              disabled={accepting}
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-[#E91E8C] py-2.5 text-sm font-semibold text-white hover:bg-[#c7177a] disabled:opacity-50 transition-colors"
            >
              {accepting ? 'Confirming…' : '✓ Accept Proposal'}
            </button>
            <button
              onClick={() => setRejectOpen(true)}
              className="flex-1 rounded-lg bg-gray-50 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              ✕ Reject with Feedback
            </button>
          </div>
        </div>
      )}

      {/* Readonly banners */}
      {proposal.status === 'accepted' && (
        <div className="rounded-lg bg-violet-50 border border-violet-200 px-4 py-3">
          <p className="text-xs font-semibold text-violet-700">
            You accepted this proposal. Admin will follow up with next steps.
          </p>
        </div>
      )}

      {proposal.status === 'rejected' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-xs font-semibold text-red-700">
            You rejected this proposal. Admin will review your feedback and may
            prepare a revised proposal.
          </p>
        </div>
      )}

      <RejectProposalModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        proposalId={proposal.id}
        requestTitle={proposal.request.objectiveCategory}
      />
    </>
  );
}
