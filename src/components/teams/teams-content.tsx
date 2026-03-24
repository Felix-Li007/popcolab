'use client';

import { useState, useTransition } from 'react';
import type {
  UserTeamItem,
  PendingTeamInvite,
} from '@/services/user-team-service';
import TeamCard from './team-card';
import CreateTeamModal from './create-team-modal';
import InviteTeamModal from './invite-team-modal';
import ManageTeamModal from './manage-team-modal';
import { respondToTeamInviteAction } from '@/actions/team-actions';

type Tab = 'my-teams' | 'pending';

type Props = {
  teams: UserTeamItem[];
  pendingInvites: PendingTeamInvite[];
};

export default function TeamsContent({ teams, pendingInvites }: Props) {
  const [tab, setTab] = useState<Tab>('my-teams');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [responding, startRespond] = useTransition();

  const [inviteTeam, setInviteTeam] = useState<{
    id: number;
    name: string;
  } | null>(null);
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
      {/* Tabs + actions bar */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setTab('my-teams')}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'my-teams'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Teams
            <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
              {teams.length}
            </span>
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'pending'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
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
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-[#E91E8C] w-44"
            />
          )}
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-[#E91E8C] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#c7177a]"
          >
            + Create Team
          </button>
        </div>
      </div>

      {/* My Teams tab */}
      {tab === 'my-teams' && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
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
                  onInvite={(id, name) => setInviteTeam({ id, name })}
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
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
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4"
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
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      disabled={responding}
                      onClick={() => handleRespond(invite.id, 'accept')}
                      className="rounded-lg bg-[#E91E8C] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#c7177a] disabled:opacity-50"
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

      {inviteTeam && (
        <InviteTeamModal
          key={`invite-${inviteTeam.id}`}
          open
          onClose={() => setInviteTeam(null)}
          teamId={inviteTeam.id}
          teamName={inviteTeam.name}
        />
      )}

      {manageTeam && (
        <ManageTeamModal
          key={`manage-${manageTeam.id}`}
          open
          onClose={() => setManageTeam(null)}
          team={manageTeam}
        />
      )}
    </>
  );
}
