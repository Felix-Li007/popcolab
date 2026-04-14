'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import type { UserRequestItem } from '@/services/user-request-service';
import type { RequestAttendeesSummary } from '@/services/request-attendee-service';
import {
  acceptProposalAction,
  cancelRequestAction,
} from '@/actions/request-actions';
import AttendeePersonalityPanel from './attendee-personality-panel';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  OPENED: { label: 'Submitted', className: 'bg-violet-100 text-violet-700' },
  PENDING: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  MATCHED: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-600' },
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
  onReject: (proposalId: number) => void;
  onResubmit: () => void;
};

export default function RequestCard({
  request,
  attendeeSummary,
  onReject,
  onResubmit,
}: Props) {
  const [accepting, startAccept] = useTransition();
  const [cancelling, startCancel] = useTransition();
  const status = STATUS_MAP[request.status] ?? {
    label: request.status,
    className: 'bg-gray-100 text-gray-600',
  };

  const isUnderReview = request.status === 'PENDING';
  const isMatched = request.status === 'MATCHED';
  const isClosed = request.status === 'CLOSED';

  const borderColor = isMatched
    ? 'border-amber-200'
    : isClosed
      ? 'border-gray-200'
      : 'border-gray-200';

  function handleAccept() {
    if (!request.proposal) return;
    startAccept(async () => {
      await acceptProposalAction(request.proposal!.id);
    });
  }

  return (
    <div
      className={`bg-white border ${borderColor} rounded-xl p-5 flex flex-col gap-3`}
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

      {isMatched && request.proposal && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wide mb-1">
              ✨ A proposal is ready for your review
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {request.proposal.rationale}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              disabled={accepting}
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-[#E91E8C] py-2 text-xs font-semibold text-white hover:bg-[#c7177a] disabled:opacity-50"
            >
              {accepting ? 'Confirming…' : '✓ Accept & Confirm'}
            </button>
            <button
              onClick={() => onReject(request.proposal!.id)}
              className="flex-1 rounded-lg bg-gray-50 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200"
            >
              ✕ Reject with Feedback
            </button>
          </div>
        </>
      )}

      {isClosed && (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wide mb-1">
              Closed
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              This request has been closed.
            </p>
          </div>
          <button
            onClick={onResubmit}
            className="self-start rounded-lg border border-[#E91E8C] px-4 py-2 text-xs font-semibold text-[#E91E8C] hover:bg-pink-50"
          >
            ↺ Submit New Request
          </button>
        </>
      )}

      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/requests/${request.id}`}
          className="rounded-lg border border-[#E91E8C] px-4 py-2 text-xs font-semibold text-[#E91E8C] hover:bg-pink-50 transition-colors"
        >
          View Details →
        </Link>
        {request.status === 'OPENED' && (
          <button
            disabled={cancelling}
            onClick={() =>
              startCancel(async () => {
                await cancelRequestAction(request.id);
              })
            }
            className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Request'}
          </button>
        )}
      </div>

      <AttendeePersonalityPanel summary={attendeeSummary} />
    </div>
  );
}
