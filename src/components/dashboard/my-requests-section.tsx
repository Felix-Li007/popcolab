'use client';

import Link from 'next/link';
import type { UserRequestSummary } from '@/services/user-dashboard-service';
import { buildDashboardRequestInvitePath } from '@/utils/url-helper';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  opened: {
    label: 'Opened',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  matched: {
    label: 'Matched',
    className: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
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
    <section
      className="dashboard-glass-panel p-5 sm:p-6"
      data-testid="my-requests-section"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <div>
          <p className="dashboard-section-eyebrow">Workflows</p>
          <h2 className="mt-1 text-base font-bold text-slate-900">
            Experience Requests
          </h2>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-[rgba(1,43,48,0.10)] bg-[rgba(255,255,255,0.62)] py-10 text-center backdrop-blur-xl">
          <span className="text-3xl">📋</span>
          <p className="text-sm font-medium text-slate-600">
            No experience requests yet.
          </p>
          <p className="text-xs text-slate-400">
            Complete your Play Personality assessment to get matched with
            experiences.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] border border-white/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.76))] shadow-[0_18px_36px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
          {requests.map((req, i) => {
            const style = STATUS_STYLES[req.status] ?? {
              label: req.status,
              className: 'bg-slate-100 text-slate-500 border-slate-200',
            };
            return (
              <div
                key={req.id}
                className={
                  'flex items-center justify-between gap-4 px-4 py-3' +
                  (i === requests.length - 1
                    ? ''
                    : ' border-b border-[rgba(1,43,48,0.06)]')
                }
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Request #{req.id}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(req.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={buildDashboardRequestInvitePath(req.id)}
                    className="dashboard-pill-button dashboard-pill-button--secondary !px-3 !py-1.5 !text-[11px]"
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
