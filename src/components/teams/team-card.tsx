'use client';

import { useTransition } from 'react';
import { deleteTeamAction } from '@/actions/team-actions';
import type { UserTeamItem } from '@/services/user-team-service';

type Props = {
  team: UserTeamItem;
  onInvite: (teamId: number, teamName: string) => void;
};

export default function TeamCard({ team, onInvite }: Props) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteTeamAction(team.id);
    });
  }

  const initials = team.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = ['#E91E8C', '#7c3aed', '#0f766e', '#f59e0b', '#3b82f6'];
  const headerColor = colors[team.id % colors.length];

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: headerColor }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-800">
            {team.name}
          </p>
          <p className="text-[10px] text-gray-400">{team.department ?? '—'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
          Active
        </span>
      </div>

      {/* Lead badge */}
      {team.isLead && (
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#E91E8C]">
          ★ You are the team lead
        </p>
      )}

      {/* Description */}
      <div className="mb-2">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          Description
        </p>
        <p
          className="mt-0.5 text-xs text-gray-700"
          style={
            !team.description ? { color: '#9ca3af', fontStyle: 'italic' } : {}
          }
        >
          {team.description ?? 'No description.'}
        </p>
      </div>

      {/* Members */}
      <div className="mb-3">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          Members
        </p>
        {team.members.length === 0 ? (
          <p className="mt-1 text-[10px] italic text-gray-400">
            No members yet.
          </p>
        ) : (
          <div className="mt-1 flex">
            {team.members.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white"
                style={{
                  background: m.color,
                  marginLeft: i === 0 ? 0 : -6,
                }}
              >
                {m.initials}
              </div>
            ))}
            {team.members.length > 4 && (
              <div
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white text-[7px] font-bold text-white"
                style={{ background: '#f59e0b', marginLeft: -6 }}
              >
                +{team.members.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button className="rounded-md border border-[#E91E8C] px-3 py-1 text-[11px] font-semibold text-[#E91E8C]">
          ✎ Manage
        </button>
        <button
          onClick={() => onInvite(team.id, team.name)}
          className="rounded-md border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600"
        >
          ✉ Invite
        </button>
      </div>

      <button
        onClick={handleDelete}
        disabled={pending}
        className="mt-2 w-full rounded-md border border-red-200 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? 'Deleting…' : '🗑 Delete team'}
      </button>
    </div>
  );
}
