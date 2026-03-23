'use client';

import { useState } from 'react';
import type {
  UserRequestItem,
  RequestStats,
  RequestFormData,
} from '@/services/user-request-service';
import RequestCard from './request-card';
import NewRequestModal from './new-request-modal';
import RejectProposalModal from './reject-proposal-modal';

type Tab = 'all' | 'opened' | 'pending' | 'matched' | 'closed';

const TABS: {
  key: Tab;
  label: string;
  statKey: keyof RequestStats | 'total';
}[] = [
  { key: 'all', label: 'All', statKey: 'total' },
  { key: 'opened', label: 'Submitted', statKey: 'submitted' },
  { key: 'pending', label: 'Under Review', statKey: 'underReview' },
  { key: 'matched', label: 'Approved', statKey: 'approved' },
  { key: 'closed', label: 'Rejected', statKey: 'rejected' },
];

type Props = {
  requests: UserRequestItem[];
  stats: RequestStats;
  formData: RequestFormData;
};

export default function RequestsContent({ requests, stats, formData }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [rejectProposalId, setRejectProposalId] = useState<number | null>(null);
  const [rejectTitle, setRejectTitle] = useState('');

  function handleModalClose() {
    setModalKey(k => k + 1);
    setModalOpen(false);
  }

  function handleReject(proposalId: number, title: string) {
    setRejectTitle(title);
    setRejectProposalId(proposalId);
  }

  function handleRejectClose() {
    setRejectProposalId(null);
    setRejectTitle('');
  }

  const filtered =
    tab === 'all' ? requests : requests.filter(r => r.status === tab);

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Requests</h1>
          <p className="text-xs text-[#E91E8C] mt-0.5">
            Submit an experience request — admin will review and respond
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-[#E91E8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c7177a]"
        >
          + New Request
        </button>
      </div>

      {/* Stats */}
      <div className="flex mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#E91E8C]' },
          {
            label: 'Submitted',
            value: stats.submitted,
            color: 'text-purple-600',
          },
          {
            label: 'Under Review',
            value: stats.underReview,
            color: 'text-amber-500',
          },
          { label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-500' },
        ].map((s, i, arr) => (
          <div
            key={s.label}
            className={`px-5 py-3 border border-gray-200 bg-white ${
              i === 0
                ? 'rounded-l-xl'
                : i === arr.length - 1
                  ? 'rounded-r-xl border-l-0'
                  : 'border-l-0'
            }`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-5">
        {TABS.map(t => {
          const count = stats[t.statKey as keyof RequestStats];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-medium border-b-2 -mb-0.5 transition-colors ${
                tab === t.key
                  ? 'border-[#E91E8C] text-[#E91E8C] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm font-semibold text-gray-500">
            No requests found.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {tab === 'all'
              ? 'Submit your first request above.'
              : 'No requests in this status.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(req => (
            <RequestCard
              key={req.id}
              request={req}
              onReject={proposalId =>
                handleReject(proposalId, req.objectiveCategory)
              }
              onResubmit={() => setModalOpen(true)}
            />
          ))}
        </div>
      )}

      <NewRequestModal
        key={modalKey}
        open={modalOpen}
        onClose={handleModalClose}
        formData={formData}
      />

      <RejectProposalModal
        key={`reject-${rejectProposalId}`}
        open={rejectProposalId !== null}
        onClose={handleRejectClose}
        proposalId={rejectProposalId}
        requestTitle={rejectTitle}
      />
    </>
  );
}
