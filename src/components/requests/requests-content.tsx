'use client';

import { useState } from 'react';
import type {
  UserRequestItem,
  RequestStats,
} from '@/services/user-request-service';
import type { Question } from '@/types/question-type';
import type { UserTeamItem } from '@/services/user-team-service';
import RequestCard from './request-card';
import NewRequestModal from './new-request-modal';
import RejectProposalModal from './reject-proposal-modal';

type Tab = 'all' | 'OPENED' | 'underReview' | 'CLOSED';

const TABS: { key: Tab; label: string; statKey: keyof RequestStats }[] = [
  { key: 'all', label: 'All', statKey: 'total' },
  { key: 'OPENED', label: 'Submitted', statKey: 'submitted' },
  { key: 'underReview', label: 'Under Review', statKey: 'underReview' },
  { key: 'CLOSED', label: 'Closed', statKey: 'closed' },
];

type Props = Readonly<{
  requests: UserRequestItem[];
  stats: RequestStats;
  memberQuestions: Question[];
  userTeams: UserTeamItem[];
}>;

export default function RequestsContent({
  requests,
  stats,
  memberQuestions,
  userTeams,
}: Props) {
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

  const UNDER_REVIEW_STATUSES = new Set([
    'PENDING',
    'PROCESSING',
    'RETRYING',
    'MATCHED',
  ]);

  const filtered =
    tab === 'all'
      ? requests
      : tab === 'underReview'
        ? requests.filter(r => UNDER_REVIEW_STATUSES.has(r.status))
        : requests.filter(r => r.status === tab);

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-section-eyebrow">Requests workspace</p>
          <h1 className="mt-2 text-xl font-bold text-gray-800">Requests</h1>
          <p className="mt-1 text-xs text-[#E91E8C]">
            Submit an experience request — admin will review and respond
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="dashboard-pill-button dashboard-pill-button--primary"
        >
          + New Request
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
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
          { label: 'Closed', value: stats.closed, color: 'text-gray-500' },
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
        memberQuestions={memberQuestions}
        userTeams={userTeams}
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
