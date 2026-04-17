'use client';

import { useState, useTransition } from 'react';
import type {
  UserTeamItem,
  PendingTeamInvite,
} from '@/services/user-team-service';
import TeamCard from './team-card';
import CreateTeamModal from './create-team-modal';
import ManageTeamModal from './manage-team-modal';
import { respondToTeamInviteAction } from '@/actions/team-actions';
import { Button } from '@/ui';

type Tab = 'my-teams' | 'pending';

type Props = {
  teams: UserTeamItem[];
  pendingInvites: PendingTeamInvite[];
};

export default function TeamsContent({
  teams,
  pendingInvites,
}: Readonly<Props>) {
  const [tab, setTab] = useState<Tab>('my-teams');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [responding, startRespond] = useTransition();

  const [manageTeam, setManageTeam] = useState<UserTeamItem | null>(null);

  function handleModalClose() {
    setModalKey(k => k + 1);
    setCreateOpen(false);
  }

  const filtered = teams.filter(
    t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function handleRespond(inviteId: number, action: 'accept' | 'reject') {
    startRespond(async () => {
      await respondToTeamInviteAction(inviteId, action);
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-section-eyebrow">Teams workspace</p>
          <h1 className="mt-2 text-xl font-bold text-gray-800">Teams</h1>
          <p className="mt-1 text-xs text-[#E91E8C]">
            Teams you own or belong to, and any pending invitations
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="dashboard-pill-button dashboard-pill-button--primary"
        >
          + Create Team
        </button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.74))] shadow-[0_18px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl">
        <div className="p-3 sm:p-4">
          <div className="grid items-end gap-3 rounded-[1.4rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.78))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setTab('my-teams')}
                variant="tab"
                size="sm"
                isActive={tab === 'my-teams'}
                className={
                  tab === 'my-teams'
                    ? '!bg-[#E91E8C] !text-white shadow-[0_12px_22px_rgba(233,30,140,0.24)]'
                    : 'bg-white/82 text-gray-500 hover:bg-white hover:text-gray-700'
                }
              >
                My Teams ({teams.length})
              </Button>
              <Button
                onClick={() => setTab('pending')}
                variant="tab"
                size="sm"
                isActive={tab === 'pending'}
                className={
                  tab === 'pending'
                    ? '!bg-[#E91E8C] !text-white shadow-[0_12px_22px_rgba(233,30,140,0.24)]'
                    : 'bg-white/82 text-gray-500 hover:bg-white hover:text-gray-700'
                }
              >
                Pending Invites ({pendingInvites.length})
              </Button>
            </div>

            <div className="flex items-end justify-start xl:justify-end">
              {tab === 'my-teams' && (
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search teams…"
                  className="h-10 w-52 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-4 text-xs text-gray-700 outline-none shadow-[0_10px_22px_rgba(15,23,42,0.04)] focus:border-[#E91E8C]"
                />
              )}
            </div>
          </div>

          <div className="mt-3">
            {tab === 'my-teams' && (
              <>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[1.85rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
                    <p className="text-sm font-semibold text-gray-500">
                      {search
                        ? 'No teams match your search.'
                        : 'You have no teams yet.'}
                    </p>
                    {!search && (
                      <p className="mt-1 text-xs text-gray-400">
                        Create one above to get started.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-4">
                    {filtered.map(team => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onManage={t => setManageTeam(t)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'pending' && (
              <>
                {pendingInvites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[1.85rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
                    <p className="text-sm font-semibold text-gray-500">
                      No pending invites.
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      When someone invites you to a team, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pendingInvites.map(invite => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.8))] px-5 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(180deg,#f15bb5,#E91E8C)] text-sm font-bold text-white shadow-[0_10px_22px_rgba(233,30,140,0.2)]">
                            {invite.teamName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {invite.teamName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Invited by{' '}
                              <span className="font-semibold text-slate-600">
                                {invite.inviterName}
                              </span>
                              {invite.inviterUsername && (
                                <span className="text-slate-400">
                                  {' '}
                                  @{invite.inviterUsername}
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-slate-400">
                              {new Date(invite.createdAt).toLocaleDateString(
                                'en-CA',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            disabled={responding}
                            onClick={() => handleRespond(invite.id, 'reject')}
                            className="dashboard-pill-button dashboard-pill-button--secondary !px-3.5 !py-1.5 !text-[11px] disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            disabled={responding}
                            onClick={() => handleRespond(invite.id, 'accept')}
                            className="dashboard-pill-button dashboard-pill-button--primary !px-3.5 !py-1.5 !text-[11px] disabled:opacity-50"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CreateTeamModal
        key={modalKey}
        open={createOpen}
        onClose={handleModalClose}
      />

      {manageTeam && (
        <ManageTeamModal
          key={`manage-${manageTeam.id}`}
          open
          onCloseAction={() => setManageTeam(null)}
          team={manageTeam}
        />
      )}
    </>
  );
}
