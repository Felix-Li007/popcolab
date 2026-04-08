'use client';

import { useState } from 'react';
import type { UserProposalItem } from '@/services/user-proposal-service';
import UserProposalCard from './user-proposal-card';

type Tab = 'all' | 'approved' | 'pending' | 'accepted' | 'rejected';

type Stats = {
  total: number;
  approved: number;
  pending: number;
  accepted: number;
  rejected: number;
};

const TABS: { key: Tab; label: string; statKey: keyof Stats }[] = [
  { key: 'all', label: 'All', statKey: 'total' },
  { key: 'approved', label: 'Action Required', statKey: 'approved' },
  { key: 'pending', label: 'Under Review', statKey: 'pending' },
  { key: 'accepted', label: 'Accepted', statKey: 'accepted' },
  { key: 'rejected', label: 'Rejected', statKey: 'rejected' },
];

type Props = {
  proposals: UserProposalItem[];
};

export default function UserProposalsContent({ proposals }: Props) {
  const [tab, setTab] = useState<Tab>('all');

  const stats: Stats = {
    total: proposals.length,
    approved: proposals.filter(p => p.status === 'approved').length,
    pending: proposals.filter(p => p.status === 'pending').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  };

  const filtered =
    tab === 'all' ? proposals : proposals.filter(p => p.status === tab);

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-section-eyebrow">Proposals workspace</p>
          <h1 className="mt-2 text-xl font-bold text-gray-800">Proposals</h1>
          <p className="mt-1 text-xs text-[#E91E8C]">
            Review experience proposals prepared for your requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 flex flex-wrap gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#E91E8C]' },
          {
            label: 'Action Required',
            value: stats.approved,
            color: 'text-emerald-600',
          },
          {
            label: 'Under Review',
            value: stats.pending,
            color: 'text-amber-500',
          },
          {
            label: 'Accepted',
            value: stats.accepted,
            color: 'text-violet-600',
          },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-500' },
        ].map(s => (
          <div
            key={s.label}
            className="min-w-[8rem] rounded-[1.4rem] border border-white/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.76))] px-5 py-3 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2 rounded-[1.4rem] border border-white/80 bg-white/62 p-2 shadow-[0_12px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        {TABS.map(t => {
          const count = stats[t.statKey];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-[#E91E8C] text-white shadow-[0_12px_22px_rgba(233,30,140,0.24)]'
                  : 'text-gray-500 hover:bg-white/80 hover:text-gray-700'
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold text-gray-500">
            No proposals found.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {tab === 'all'
              ? 'Proposals will appear here once admin prepares them for your requests.'
              : 'No proposals in this status.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(proposal => (
            <UserProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </>
  );
}
