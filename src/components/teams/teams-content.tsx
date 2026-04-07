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
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 rounded-[1.4rem] border border-white/80 bg-white/60 p-2 shadow-[0_12px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          <button
            onClick={() => setTab('my-teams')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              tab === 'my-teams'
                ? 'bg-[#E91E8C] text-white shadow-[0_12px_22px_rgba(233,30,140,0.24)]'
                : 'text-gray-500 hover:bg-white/80 hover:text-gray-700'
            }`}
          >
            My Teams{' '}
            <span className="ml-1.5 rounded-full bg-white/55 px-1.5 py-0.5 text-[10px] font-bold text-current">
              {teams.length}
            </span>
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              tab === 'pending'
                ? 'bg-[#E91E8C] text-white shadow-[0_12px_22px_rgba(233,30,140,0.24)]'
                : 'text-gray-500 hover:bg-white/80 hover:text-gray-700'
            }`}
          >
            Pending Invites
            {pendingInvites.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[#E91E8C] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingInvites.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'my-teams' && (
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teams…"
              className="w-44 rounded-full border border-white/80 bg-white/78 px-4 py-2 text-xs text-gray-700 outline-none backdrop-blur-xl focus:border-[#E91E8C]"
            />
          )}
          <button
            onClick={() => setCreateOpen(true)}
            className="dashboard-pill-button dashboard-pill-button--primary"
          >
            + Create Team
          </button>
        </div>
      </div>

      {/* My Teams tab */}
      {tab === 'my-teams' && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Pending Invites tab */}
      {tab === 'pending' && (
        <>
          {pendingInvites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
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
                  className="flex items-center justify-between gap-4 rounded-[1.45rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.76))] px-5 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E91E8C] text-sm font-bold text-white">
                      {invite.teamName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {invite.teamName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Invited by{' '}
                        <span className="font-semibold text-gray-600">
                          {invite.inviterName}
                        </span>
                        {invite.inviterUsername && (
                          <span className="text-gray-400">
                            {' '}
                            @{invite.inviterUsername}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400">
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
                      className="dashboard-pill-button dashboard-pill-button--secondary !px-3 !py-1.5 !text-[11px] disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      disabled={responding}
                      onClick={() => handleRespond(invite.id, 'accept')}
                      className="dashboard-pill-button dashboard-pill-button--primary !px-3 !py-1.5 !text-[11px] disabled:opacity-50"
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
