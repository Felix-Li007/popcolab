'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  addInviteesToTeamAction,
  type InviteToTeamState,
} from '@/actions/team-actions';

type Props = {
  open: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
};

type Invitee = { value: string };

const initial: InviteToTeamState = {};

export default function InviteTeamModal({
  open,
  onClose,
  teamId,
  teamName,
}: Props) {
  const [state, formAction, pending] = useActionState(
    addInviteesToTeamAction,
    initial
  );
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (pending) wasPendingRef.current = true;
    if (wasPendingRef.current && !pending && !state.error && open) {
      wasPendingRef.current = false;
      onClose();
    }
  }, [pending, state, open, onClose]);

  function addInvitee() {
    const val = inputVal.trim();
    if (!val) return;
    if (invitees.find(i => i.value === val)) {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#111827] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">✉ Invite Members</h2>
            <p className="text-[11px] text-white/50 mt-0.5">{teamName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form action={formAction}>
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="teamName" value={teamName} />
          <input
            type="hidden"
            name="invitees"
            value={JSON.stringify(invitees)}
          />

          <div className="p-6 flex flex-col gap-4">
            <p className="text-[11px] text-gray-500">
              Add by @username or email. They&apos;ll receive an invite link to
              join the team.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Add people
              </label>
              <div
                className="flex min-h-[44px] flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 cursor-text"
                onClick={() => inputRef.current?.focus()}
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
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || invitees.length === 0}
              className="rounded-lg bg-[#E91E8C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c7177a] disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Send Invites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
