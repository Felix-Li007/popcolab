'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { UserRequestItem } from '@/services/user-request-service';
import type { RequestAttendeesSummary } from '@/services/request-attendee-service';
import AttendeePersonalityPanel from './attendee-personality-panel';
import { cancelRequestAction } from '@/actions/request-actions';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  OPENED: { label: 'Submitted', className: 'bg-violet-100 text-violet-700' },
  PENDING: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  PROCESSING: {
    label: 'Under Review',
    className: 'bg-amber-100 text-amber-700',
  },
  RETRYING: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
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

type Props = {
  request: UserRequestItem;
  attendeeSummary: RequestAttendeesSummary;
};

export default function RequestDetailContent({
  request,
  attendeeSummary,
}: Props) {
  const [cancelling, startCancel] = useTransition();
  const router = useRouter();
  const status = STATUS_MAP[request.status] ?? {
    label: request.status,
    className: 'bg-gray-100 text-gray-600',
  };

  return (
    <>
      {/* Back link */}
      <Link
        href="/dashboard/requests"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Back to Requests
      </Link>

      {/* Header */}
      <div className="dashboard-glass-panel px-5 py-5 sm:px-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="dashboard-section-eyebrow">Request #{request.id}</p>
            <h1 className="dashboard-section-title mt-1">
              {request.objectiveCategory}
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Submitted {formatDate(request.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Request details */}
      <div className="dashboard-glass-panel px-5 py-4 sm:px-6 mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
          Request Details
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              Preferred Date
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
              Submitted By
            </span>
            <span className="text-xs font-medium text-gray-700">You</span>
          </div>
        </div>

        {/* Status message */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          {request.status === 'OPENED' && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-400">
                ⏳ Waiting for admin to review your request
              </p>
              <button
                disabled={cancelling}
                onClick={() =>
                  startCancel(async () => {
                    await cancelRequestAction(request.id);
                    router.push('/dashboard/requests');
                  })
                }
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel Request'}
              </button>
            </div>
          )}
          {(request.status === 'PENDING' ||
            request.status === 'PROCESSING' ||
            request.status === 'RETRYING' ||
            request.status === 'MATCHED') && (
            <p className="text-[11px] text-amber-600">
              🔍 Admin is currently reviewing this request
            </p>
          )}
          {request.status === 'CLOSED' && (
            <p className="text-[11px] text-gray-500">
              This request has been closed.
            </p>
          )}
        </div>
      </div>

      {/* Attendees & Collective Personality Analysis */}
      <div className="dashboard-glass-panel px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
          Collective Personality Analysis
        </p>
        <p className="text-[11px] text-gray-400 mb-3">
          Personality results of all invited attendees to help you make a sound
          decision on proposals.
        </p>

        {attendeeSummary.attendees.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">
            No attendees invited yet.
          </p>
        ) : (
          <AttendeePersonalityPanel summary={attendeeSummary} />
        )}
      </div>
    </>
  );
}
