'use client';

import { useTransition } from 'react';
import type { UserRequestItem } from '@/services/user-request-service';
import { acceptProposalAction } from '@/actions/request-actions';

const STATUS_MAP = {
  opened: { label: 'Submitted', className: 'bg-violet-100 text-violet-700' },
  pending: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  matched: { label: 'Approved ✓', className: 'bg-green-100 text-green-700' },
  closed: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
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
  onReject: (proposalId: number) => void;
  onResubmit: () => void;
};

export default function RequestCard({ request, onReject, onResubmit }: Props) {
  const [accepting, startAccept] = useTransition();
  const status = STATUS_MAP[request.status];

  const borderColor =
    request.status === 'matched'
      ? 'border-green-200'
      : request.status === 'closed'
        ? 'border-red-200'
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
            {request.status === 'matched' ? 'Confirmed date' : 'Preferred date'}
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
      {request.status === 'opened' && (
        <p className="text-[11px] text-gray-400 pt-2.5 border-t border-gray-100">
          ⏳ Waiting for admin to review your request
        </p>
      )}

      {request.status === 'pending' && (
        <p className="text-[11px] text-amber-600 pt-2.5 border-t border-gray-100">
          🔍 Admin is currently reviewing this request
        </p>
      )}

      {request.status === 'matched' && request.proposal && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold text-green-800 uppercase tracking-wide mb-1">
              ✨ Why this is perfect for your team
            </p>
            <p className="text-[11px] text-green-800 leading-relaxed">
              {request.proposal.rationale}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              disabled={accepting}
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-green-500 py-2 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50"
            >
              {accepting ? 'Confirming…' : '✓ Accept & Confirm'}
            </button>
            <button
              onClick={() => onReject(request.proposal!.id)}
              className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              ✕ Reject with Feedback
            </button>
          </div>
        </>
      )}

      {request.status === 'closed' && (
        <>
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold text-red-800 uppercase tracking-wide mb-1">
              Admin Feedback
            </p>
            <p className="text-[11px] text-red-800 leading-relaxed">
              {request.proposal?.rationale ??
                'This request was closed by admin.'}
            </p>
          </div>
          <button
            onClick={onResubmit}
            className="self-start rounded-lg border border-[#E91E8C] px-4 py-2 text-xs font-semibold text-[#E91E8C] hover:bg-pink-50"
          >
            ↺ Resubmit Request
          </button>
        </>
      )}
    </div>
  );
}
