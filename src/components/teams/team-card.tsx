'use client';

import { useTransition } from 'react';
import {
  deleteTeamAction,
  resendTeamInviteAction,
} from '@/actions/team-actions';
import type { UserTeamItem } from '@/services/user-team-service';
import { Button } from '@/ui';

type Props = {
  team: UserTeamItem;
  onManage: (team: UserTeamItem) => void;
};

export default function TeamCard({ team, onManage }: Props) {
  const [pending, startTransition] = useTransition();
  const [resending, startResend] = useTransition();

  function handleResend(inviteId: number) {
    startResend(async () => {
      await resendTeamInviteAction(inviteId);
    });
  }

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
  const memberCount = team.members.length;
  const pendingInviteCount = team.pendingInvites.length;
  const teamStateLabel =
    memberCount > 3
      ? 'Growing team'
      : memberCount > 1
        ? 'Active team'
        : 'New team';

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[1.85rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.82))] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
      <div
        className="absolute inset-x-0 top-0 h-24 opacity-90"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${headerColor} 14%, white), transparent)`,
        }}
      />
      <div className="pointer-events-none absolute left-6 top-0 h-px w-24 bg-white/80" />

      <div className="relative mb-4 flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] text-sm font-bold text-white shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${headerColor} 80%, white), ${headerColor})`,
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-900">
              {team.name}
            </p>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Active
            </span>
          </div>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {team.department || 'No department set'}
          </p>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            {teamStateLabel}
          </p>
        </div>
      </div>

      <div className="relative mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[1.2rem] border border-white/75 bg-white/78 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_8px_18px_rgba(15,23,42,0.03)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Members
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <p className="text-2xl font-bold leading-none text-slate-900">
              {memberCount}
            </p>
            {team.members.length > 0 ? (
              <div className="flex">
                {team.members.slice(0, 3).map((m, i) => (
                  <div
                    key={m.teamMateId}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white shadow-[0_8px_16px_rgba(15,23,42,0.08)]"
                    style={{
                      background: m.color,
                      marginLeft: i === 0 ? 0 : -8,
                    }}
                    title={m.name}
                  >
                    {m.initials}
                  </div>
                ))}
                {team.members.length > 3 && (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white shadow-[0_8px_16px_rgba(15,23,42,0.08)]"
                    style={{ background: '#f59e0b', marginLeft: -8 }}
                  >
                    +{team.members.length - 3}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Current active teammates
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-white/75 bg-white/78 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_8px_18px_rgba(15,23,42,0.03)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Invites
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pendingInviteCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Pending responses</p>
        </div>
      </div>

      {team.isLead && (
        <div className="relative mb-4 rounded-[1.2rem] border border-[#f6c0dd] bg-[linear-gradient(135deg,rgba(255,244,250,0.96),rgba(255,255,255,0.94))] px-4 py-3 shadow-[0_10px_24px_rgba(233,30,140,0.08)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E91E8C]">
            Team lead
          </p>
          <p className="mt-1 text-sm font-semibold text-[#9f2c68]">
            You manage members, invites, and team settings.
          </p>
        </div>
      )}

      <div className="mb-4 rounded-[1.2rem] border border-white/75 bg-white/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_rgba(15,23,42,0.03)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Description
        </p>
        <p
          className="mt-2 text-sm leading-6 text-slate-700"
          style={
            !team.description ? { color: '#94a3b8', fontStyle: 'italic' } : {}
          }
        >
          {team.description ?? 'No description.'}
        </p>
      </div>

      {team.isLead && team.pendingInvites.length > 0 && (
        <div className="mb-4 rounded-[1.2rem] border border-white/75 bg-white/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_rgba(15,23,42,0.03)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Pending invites
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {team.pendingInvites.map(inv => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-[0.95rem] bg-slate-50/85 px-3 py-2"
              >
                <span className="truncate text-[11px] font-medium text-slate-600">
                  {inv.displayValue}
                </span>
                <Button
                  disabled={resending}
                  onClick={() => handleResend(inv.id)}
                  variant="text"
                  size="xs"
                  className="!h-auto !min-w-0 !rounded-full !bg-[#fff4fa] !px-2.5 !py-1 text-[10px] !font-semibold text-[#E91E8C] shadow-none disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex gap-2">
        {team.isLead ? (
          <Button
            onClick={() => onManage(team)}
            variant="secondary"
            size="xs"
            className="!min-w-0 !rounded-full border-[#f3b7cc] !px-4 text-[11px] text-[#E91E8C] hover:!bg-pink-50"
          >
            Manage Team
          </Button>
        ) : (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-500">
            Team member
          </div>
        )}

        <Button
          onClick={handleDelete}
          disabled={pending}
          variant="secondary"
          size="xs"
          className="!rounded-full border-red-200 text-[11px] text-red-500 hover:!bg-red-50 disabled:opacity-50"
        >
          {pending ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </div>
  );
}
