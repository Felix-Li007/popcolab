'use client';

import Link from 'next/link';
import type { UserRequestSummary } from '@/services/user-dashboard-service';
import { buildDashboardRequestInvitePath } from '@/utils/url-helper';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  opened: {
    label: 'Opened',
    className: 'bg-teal-50 text-teal-deep border-teal-100',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  matched: {
    label: 'Matched',
    className: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
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
  requests: UserRequestSummary[];
};

export default function MyRequestsSection({ requests }: Readonly<Props>) {
  return (
    <section data-testid="my-requests-section">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <h2 className="text-sm font-bold text-gray-800">Experience Requests</h2>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
          <span className="text-3xl">📋</span>
          <p className="text-sm font-medium text-gray-500">
            No experience requests yet.
          </p>
          <p className="text-xs text-gray-400">
            Complete your Play Personality assessment to get matched with
            experiences.
          </p>
        </div>
      ) : (
        <div className="rounded-[24px] border border-gray-200 bg-white overflow-hidden shadow-sm">
          {requests.map((req, i) => {
            const style = STATUS_STYLES[req.status] ?? {
              label: req.status,
              className: 'bg-gray-100 text-gray-500 border-gray-200',
            };
            return (
              <div
                key={req.id}
                className={
                  'flex items-center justify-between gap-4 px-4 py-3' +
                  (i === requests.length - 1 ? '' : ' border-b border-gray-100')
                }
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Request #{req.id}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(req.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={buildDashboardRequestInvitePath(req.id)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Invite
                  </Link>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
