'use client';

import { useActionState, useEffect, useRef, useTransition } from 'react';
import {
  updateTeamAction,
  removeTeamMemberAction,
  type UpdateTeamState,
} from '@/actions/team-actions';
import type { UserTeamItem } from '@/services/user-team-service';

type Props = {
  open: boolean;
  onClose: () => void;
  team: UserTeamItem;
};

const initial: UpdateTeamState = {};

export default function ManageTeamModal({ open, onClose, team }: Props) {
  const [state, formAction, pending] = useActionState(
    updateTeamAction,
    initial
  );
  const [removing, startRemove] = useTransition();
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (pending) wasPendingRef.current = true;
    if (
      wasPendingRef.current &&
      !pending &&
      !state.error &&
      !state.fieldErrors &&
      open
    ) {
      wasPendingRef.current = false;
      onClose();
    }
  }, [pending, state, open, onClose]);

  function handleRemoveMember(teamMateId: number, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return;
    startRemove(async () => {
      await removeTeamMemberAction(teamMateId);
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between bg-[#111827] px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-white">✎ Manage Team</h2>
            <p className="text-[11px] text-white/50 mt-0.5">{team.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form action={formAction}>
          <input type="hidden" name="teamId" value={team.id} />

          <div className="p-6 flex flex-col gap-4">
            {/* Team details section */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Team details
            </p>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Team name
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                  Required
                </span>
              </label>
              <input
                name="name"
                type="text"
                defaultValue={team.name}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
              />
              {state.fieldErrors?.name && (
                <p className="text-[11px] text-red-600">
                  {state.fieldErrors.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Department
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                  Optional
                </span>
              </label>
              <input
                name="department"
                type="text"
                defaultValue={team.department ?? ''}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Description
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                  Optional
                </span>
              </label>
              <textarea
                name="description"
                defaultValue={team.description ?? ''}
                rows={3}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white resize-none"
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {state.error}
              </p>
            )}

            {/* Members section */}
            <hr className="border-gray-100" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Current members
            </p>

            {team.members.length === 0 ? (
              <p className="text-xs italic text-gray-400">No members yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {team.members.map(m => (
                  <li
                    key={m.teamMateId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: m.color }}
                      >
                        {m.initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-gray-400">{m.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={removing}
                      onClick={() => handleRemoveMember(m.teamMateId, m.name)}
                      className="rounded-md border border-red-200 px-2.5 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#E91E8C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c7177a] disabled:opacity-60"
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
