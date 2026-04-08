'use client';

import Link from 'next/link';
import type { UserProposalItem } from '@/services/user-proposal-service';

const STATUS_MAP: Record<
  string,
  { label: string; className: string; description: string }
> = {
  pending: {
    label: 'Awaiting Review',
    className: 'bg-amber-100 text-amber-700',
    description: 'Admin is reviewing this proposal',
  },
  approved: {
    label: 'Ready for You',
    className: 'bg-emerald-100 text-emerald-700',
    description: 'Review this proposal and accept or reject it',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-violet-100 text-violet-700',
    description: 'You accepted this proposal',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-600',
    description: 'You rejected this proposal',
  },
};

function timeAgo(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

type Props = {
  proposal: UserProposalItem;
};

export default function UserProposalCard({ proposal }: Props) {
  const status = STATUS_MAP[proposal.status] ?? {
    label: proposal.status,
    className: 'bg-gray-100 text-gray-600',
    description: '',
  };

  const isApproved = proposal.status === 'approved';
  const borderColor = isApproved ? 'border-emerald-200' : 'border-gray-200';

  return (
    <div
      className={`bg-white border ${borderColor} rounded-xl p-5 flex flex-col gap-3`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-800">
            {proposal.objectiveCategory}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Proposal #{proposal.id} · created {timeAgo(proposal.createdAt)}
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Experiences
          </span>
          <span className="text-xs font-medium text-gray-700">
            {proposal.experienceCount}{' '}
            {proposal.experienceCount === 1 ? 'option' : 'options'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Delivery
          </span>
          <span className="text-xs font-medium text-gray-700">
            {proposal.deliveryMethod.split(';')[0]?.trim() || '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Capacity
          </span>
          <span className="text-xs font-medium text-gray-700">
            {proposal.capacityMax > 0 ? `Up to ${proposal.capacityMax}` : '—'}
          </span>
        </div>
      </div>

      {/* Rationale preview */}
      {proposal.rationale && proposal.rationale !== '-' && (
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 border-t border-gray-100 pt-2.5">
          {proposal.rationale}
        </p>
      )}

      {/* Status hint */}
      {isApproved && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
            Action required
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Open the proposal to accept or reject with feedback.
          </p>
        </div>
      )}

      {/* Footer link */}
      <Link
        href={`/dashboard/proposals/${proposal.id}`}
        className="self-start rounded-lg border border-[#E91E8C] px-4 py-2 text-xs font-semibold text-[#E91E8C] hover:bg-pink-50 transition-colors"
      >
        View Details →
      </Link>
    </div>
  );
}
