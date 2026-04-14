'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';
import {
  updateTeamAction,
  removeTeamMemberAction,
  addInviteesToTeamAction,
  type UpdateTeamState,
  type InviteToTeamState,
} from '@/actions/team-actions';
import type { UserTeamItem } from '@/services/user-team-service';

type Props = {
  open: boolean;
  onCloseAction: () => void;
  team: UserTeamItem;
};

const initialUpdate: UpdateTeamState = {};
const initialInvite: InviteToTeamState = {};

type Invitee = { value: string };

export default function ManageTeamModal({
  open,
  onCloseAction,
  team,
}: Readonly<Props>) {
  const [state, formAction, pending] = useActionState(
    updateTeamAction,
    initialUpdate
  );
  const [inviteState, inviteFormAction, invitePending] = useActionState(
    addInviteesToTeamAction,
    initialInvite
  );
  const [removing, startRemove] = useTransition();
  const wasPendingRef = useRef(false);

  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wasInvitePendingRef = useRef(false);

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
      onCloseAction();
    }
  }, [pending, state, open, onCloseAction]);

  useEffect(() => {
    if (invitePending) wasInvitePendingRef.current = true;
    if (wasInvitePendingRef.current && !invitePending && !inviteState.error) {
      wasInvitePendingRef.current = false;
      setTimeout(() => {
        setInvitees([]);
        setInputVal('');
      }, 0);
    }
  }, [invitePending, inviteState]);

  function handleRemoveMember(teamMateId: number, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return;
    startRemove(async () => {
      await removeTeamMemberAction(teamMateId);
    });
  }

  function addInvitee() {
    const val = inputVal.trim();
    if (!val) return;
    if (invitees.some(i => i.value === val)) {
      setInputVal('');
      return;
    }
    setInvitees(prev => [...prev, { value: val }]);
    setInputVal('');
  }

  function removeInvitee(val: string) {
    setInvitees(prev => prev.filter(i => i.value !== val));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInvitee();
    }
  }

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onCloseAction();
      }}
      onKeyDown={e => {
        if (e.key === 'Escape') onCloseAction();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#111827] px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-white">✎ Manage Team</h2>
            <p className="text-[11px] text-white/50 mt-0.5">{team.name}</p>
          </div>
          <button
            onClick={onCloseAction}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Team details form */}
        <form action={formAction}>
          <input type="hidden" name="teamId" value={team.id} />

          <div className="px-6 pt-6 pb-4 flex flex-col gap-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Team details
            </p>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="manage-team-name"
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
              >
                Team name{' '}
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                  Required
                </span>
              </label>
              <input
                id="manage-team-name"
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
              <label
                htmlFor="manage-team-department"
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
              >
                Department{' '}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                  Optional
                </span>
              </label>
              <input
                id="manage-team-department"
                name="department"
                type="text"
                defaultValue={team.department ?? ''}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="manage-team-description"
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
              >
                Description{' '}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                  Optional
                </span>
              </label>
              <textarea
                id="manage-team-description"
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
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onCloseAction}
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

        {/* Current members */}
        <div className="px-6 pb-4 flex flex-col gap-3">
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

        {/* Invite members form */}
        <form action={inviteFormAction}>
          <input type="hidden" name="teamId" value={team.id} />
          <input type="hidden" name="teamName" value={team.name} />
          <input
            type="hidden"
            name="invitees"
            value={JSON.stringify([
              ...invitees,
              ...(inputVal.trim() ? [{ value: inputVal.trim() }] : []),
            ])}
          />

          <div className="px-6 pb-6 flex flex-col gap-3">
            <hr className="border-gray-100" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Invite members
            </p>
            <p className="text-[11px] text-gray-400 -mt-1">
              Add by @username or email. Invited people will receive an email.
            </p>

            <div className="flex flex-col gap-1">
              {}
              <div
                role="group"
                className="flex min-h-[44px] flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 cursor-text"
                onClick={() => inputRef.current?.focus()}
                onKeyDown={() => inputRef.current?.focus()}
              >
                {invitees.map(inv => (
                  <span
                    key={inv.value}
                    className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#E91E8C] text-[7px] font-bold text-white">
                      {inv.value[0]?.toUpperCase()}
                    </span>
                    {inv.value}
                    <button
                      type="button"
                      onClick={() => removeInvitee(inv.value)}
                      className="ml-0.5 text-gray-400 hover:text-gray-600 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={addInvitee}
                  placeholder="@username or email, press Enter…"
                  className="min-w-[200px] flex-1 border-none bg-transparent text-xs outline-none"
                />
              </div>

              {inviteState.error && (
                <p className="text-[11px] text-red-600">{inviteState.error}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={invitePending}
                className="rounded-lg bg-[#111827] px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {invitePending ? 'Sending…' : '✉ Send Invites'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
