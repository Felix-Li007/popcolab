'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRequestItem } from '@/services/request-service';
import type { RequestAttendeesSummary } from '@/services/request-attendee-service';
import { Badge, Button } from '@/ui';
import { cancelRequestAction } from '@/actions/request-actions';
import AttendeePersonalityPanel from './attendee-personality-panel';

const STATUS_MAP: Record<
  string,
  { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }
> = {
  OPENED: { label: 'OPENED', variant: 'secondary' },
  PENDING: { label: 'PENDING', variant: 'warning' },
  MATCHED: { label: 'MATCHED', variant: 'info' },
  CLOSED: { label: 'CLOSED', variant: 'default' },
};

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
  request: UserRequestItem;
  attendeeSummary: RequestAttendeesSummary;
  onResubmit: () => void;
};

export default function RequestCard({
  request,
  attendeeSummary,
  onResubmit,
}: Props) {
  const [cancelling, startCancel] = useTransition();
  const router = useRouter();
  const status = STATUS_MAP[request.status] ?? {
    label: request.status,
    variant: 'default' as const,
  };

  const isUnderReview = request.status === 'PENDING';
  const isMatched = request.status === 'MATCHED';
  const isClosed = request.status === 'CLOSED';
  const matchedProposal = isMatched ? request.proposal : null;
  const acceptedProposal =
    isClosed && request.proposal?.status === 'ACCEPTED'
      ? request.proposal
      : null;
  const hasAcceptedProposal = Boolean(acceptedProposal);

  const borderColor = isMatched
    ? 'border-amber-200/80'
    : isClosed
      ? 'border-gray-200'
      : 'border-gray-200';

  return (
    <div
      className={`border ${borderColor} rounded-[1.75rem] p-5 flex flex-col gap-3 shadow-[0_18px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] ${
        isMatched
          ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,251,241,0.84))] backdrop-blur-xl'
          : 'bg-white'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-800">
            {request.objectiveCategory}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Submitted {timeAgo(request.createdAt)}
          </p>
        </div>
        <Badge
          size="xs"
          variant={status.variant}
          className={
            isMatched
              ? 'border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(219,234,254,0.88))] text-blue-700 shadow-[0_10px_22px_rgba(59,130,246,0.14),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl'
              : ''
          }
        >
          {status.label}
        </Badge>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Preferred date
          </span>
          <span className="text-xs font-medium text-gray-700">
            {formatDate(request.preferredDate)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Participants
          </span>
          <span className="text-xs font-medium text-gray-700">
            {request.participantCount
              ? `${request.participantCount} people`
              : '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            Submitted by
          </span>
          <span className="text-xs font-medium text-gray-700">You</span>
        </div>
      </div>

      {/* Status-specific content */}
      {request.status === 'OPENED' && (
        <p className="text-[11px] text-gray-400 pt-2.5 border-t border-gray-100">
          ⏳ Waiting for admin to review your request
        </p>
      )}

      {isUnderReview && (
        <p className="text-[11px] text-amber-600 pt-2.5 border-t border-gray-100">
          🔍 Admin is currently reviewing this request
        </p>
      )}

      {isMatched && matchedProposal && (
        <div className="space-y-3 border-t border-white/70 pt-3">
          <div className="relative overflow-hidden rounded-[1.3rem] border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,248,230,0.8)_58%,rgba(255,255,255,0.72))] px-4 py-3.5 shadow-[0_20px_35px_rgba(245,158,11,0.08),0_8px_18px_rgba(236,72,153,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-10 rounded-full bg-white/45 blur-2xl" />
            <p className="relative mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-800">
              ✨ A proposal is ready for your review
            </p>
            <p className="relative text-[11px] leading-relaxed text-amber-900">
              {matchedProposal.rationale}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() =>
                router.push(`/dashboard/proposals/${matchedProposal.id}`)
              }
              variant="secondary"
              size="sm"
              className="!rounded-full !border !border-[#f3b7cc] !bg-white !text-[#ef4444] !shadow-none hover:!border-[#ee9fbc] hover:!bg-[#fff5f7] hover:!text-[#ef4444]"
            >
              View Proposal
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/requests/${request.id}`)}
              variant="secondary"
              size="sm"
              className="!rounded-full !border !border-[#f3b7cc] !bg-white !text-[#ef4444] !shadow-none hover:!border-[#ee9fbc] hover:!bg-[#fff5f7] hover:!text-[#ef4444]"
            >
              View Details
            </Button>
          </div>
        </div>
      )}

      {isClosed && (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-[1.25rem] px-3 py-2.5">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wide mb-1">
              Closed
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              {hasAcceptedProposal
                ? 'This request has been closed. You can still review the accepted proposal.'
                : 'This request has been closed.'}
            </p>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {acceptedProposal && (
          <Button
            onClick={() =>
              router.push(`/dashboard/proposals/${acceptedProposal.id}`)
            }
            variant="secondary"
            size="sm"
            className="!rounded-full !border !border-[#f3b7cc] !bg-white !text-[#ef4444] !shadow-none hover:!border-[#ee9fbc] hover:!bg-[#fff5f7] hover:!text-[#ef4444]"
          >
            View Proposal
          </Button>
        )}
        {isClosed && !hasAcceptedProposal && (
          <Button
            onClick={onResubmit}
            variant="secondary"
            size="sm"
            className="!rounded-full !border !border-[#f3b7cc] !bg-white !text-[#ef4444] !shadow-none hover:!border-[#ee9fbc] hover:!bg-[#fff5f7] hover:!text-[#ef4444]"
          >
            Submit New Request
          </Button>
        )}
        {!isMatched && (
          <Button
            onClick={() => router.push(`/dashboard/requests/${request.id}`)}
            variant="secondary"
            size="sm"
            className="!rounded-full !border !border-[#f3b7cc] !bg-white !text-[#ef4444] !shadow-none hover:!border-[#ee9fbc] hover:!bg-[#fff5f7] hover:!text-[#ef4444]"
          >
            View Details
          </Button>
        )}
        {request.status === 'OPENED' && (
          <Button
            disabled={cancelling}
            onClick={() =>
              startCancel(async () => {
                await cancelRequestAction(request.id);
              })
            }
            variant="secondary"
            size="sm"
            className="border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Request'}
          </Button>
        )}
      </div>

      <AttendeePersonalityPanel summary={attendeeSummary} />
    </div>
  );
}
