'use client';

import Link from 'next/link';
import { Button } from '@/ui';
import type { UserProposalItem } from '@/services/proposal-service';

const STATUS_MAP: Record<
  string,
  { label: string; className: string; description: string }
> = {
  PENDING: {
    label: 'PENDING',
    className: 'bg-amber-100 text-amber-700',
    description: 'Admin is reviewing this proposal',
  },
  APPROVED: {
    label: 'APPROVED',
    className: 'bg-emerald-100 text-emerald-700',
    description: 'Review this proposal and accept or reject it',
  },
  ACCEPTED: {
    label: 'ACCEPTED',
    className: 'bg-violet-100 text-violet-700',
    description: 'You accepted this proposal',
  },
  REJECTED: {
    label: 'REJECTED',
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

function formatPrice(value: number | null): string {
  if (value === null) return 'Pricing on request';
  return `$${value.toLocaleString()}`;
}

function formatDate(value: Date): string {
  return new Date(value).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

  const isApproved = proposal.status === 'APPROVED';
  const borderColor = isApproved ? 'border-emerald-200' : 'border-gray-200';
  const pricedExperiences = proposal.experiences.filter(
    experience => experience.startingPrice !== null
  );
  const lowestStartingPrice =
    pricedExperiences.length > 0
      ? Math.min(
          ...pricedExperiences.map(experience => experience.startingPrice!)
        )
      : null;

  return (
    <div
      className={`relative overflow-hidden border ${borderColor} rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.84))] p-5 flex flex-col gap-4 shadow-[0_18px_38px_rgba(15,23,42,0.06),0_6px_18px_rgba(233,30,140,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.45),transparent)]" />
      <div className="pointer-events-none absolute left-6 top-0 h-px w-24 bg-white/85" />

      {/* Top row */}
      <div className="relative flex items-start justify-between gap-3">
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

      <div className="relative grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-pink-100 bg-[linear-gradient(135deg,rgba(255,244,250,0.98),rgba(255,255,255,0.95))] px-4 py-3 shadow-[0_16px_30px_rgba(233,30,140,0.1),inset_0_1px_0_rgba(255,255,255,0.85)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E91E8C]/70">
            Score
          </p>
          <p className="mt-2 text-2xl font-bold text-[#E91E8C]">
            {proposal.score !== null ? proposal.score.toFixed(2) : '—'}
          </p>
          <p className="mt-1 text-[11px] text-[#9f2c68]">
            Overall match confidence
          </p>
        </div>

        <div className="rounded-[1.2rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.98),rgba(255,255,255,0.95))] px-4 py-3 shadow-[0_16px_30px_rgba(14,165,233,0.1),inset_0_1px_0_rgba(255,255,255,0.85)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700/70">
            Experiences
          </p>
          <p className="mt-2 text-2xl font-bold text-sky-700">
            {proposal.experienceCount}
          </p>
          <p className="mt-1 text-[11px] text-sky-700/80">
            {proposal.experienceCount === 1
              ? 'Included recommendation'
              : 'Included recommendations'}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/80 pt-3">
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Created
          </span>
          <span className="text-xs font-medium text-gray-700">
            {formatDate(proposal.createdAt)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            {proposal.status === 'ACCEPTED' ? 'Accepted' : 'Starting At'}
          </span>
          <span className="text-xs font-medium text-gray-700">
            {proposal.status === 'ACCEPTED'
              ? formatDate(proposal.updatedAt)
              : formatPrice(lowestStartingPrice)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Lead Option
          </span>
          <span className="text-xs font-medium text-gray-700">
            {proposal.experienceTitle}
          </span>
        </div>
      </div>

      {/* Rationale preview */}
      {proposal.rationale && proposal.rationale !== '-' && (
        <div className="rounded-[1rem] border border-white/75 bg-white/62 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_8px_18px_rgba(15,23,42,0.03)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
            Rationale
          </p>
          <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed line-clamp-2">
            {proposal.rationale}
          </p>
        </div>
      )}

      {/* Status hint */}
      {isApproved && (
        <div className="rounded-[1rem] bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
            Action required
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Open the proposal to accept or reject with feedback.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5">
        <Link href={`/dashboard/proposals/${proposal.id}`}>
          <Button
            variant="secondary"
            size="sm"
            className="!rounded-full !border !border-[#f3b7cc] !bg-white !text-[#ef4444] !shadow-none hover:!border-[#ee9fbc] hover:!bg-[#fff5f7] hover:!text-[#ef4444]"
          >
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
