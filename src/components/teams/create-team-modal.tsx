'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createTeamAction, type CreateTeamState } from '@/actions/team-actions';
import ModalShell from '@/components/shared/modal-shell';
import { Button } from '@/ui';

type Invitee = { value: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

const initial: CreateTeamState = {};

export default function CreateTeamModal({ open, onClose }: Readonly<Props>) {
  const [state, formAction, pending] = useActionState(
    createTeamAction,
    initial
  );
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPendingRef.current = true;
    }
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
    <ModalShell
      isOpen={open}
      onClose={onClose}
      title="Create New Team"
      panelClassName="max-w-[620px]"
      bodyClassName="p-0"
    >
      <form action={formAction}>
        <input
          type="hidden"
          name="invitees"
          value={JSON.stringify([
            ...invitees,
            ...(inputVal.trim() ? [{ value: inputVal.trim() }] : []),
          ])}
        />

        <div className="px-4 py-2 flex flex-col gap-4">
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
              placeholder="e.g. Design Team"
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
              placeholder="e.g. Marketing"
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
              placeholder="What does this team do?"
              rows={3}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white resize-none"
            />
          </div>

          <hr className="border-gray-100" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Invite members
          </p>
          <p className="text-[11px] text-gray-400 -mt-2">
            Add by @username or email. Invites are not tied to any experience —
            anyone can be invited.
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
            <p className="text-[10px] text-gray-400">
              Invited people will receive an email to join Pop CoLab if they
              haven&apos;t already.
            </p>
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {state.error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-4 py-2">
          <Button type="button" onClick={onClose} variant="secondary" size="md">
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create team & send invites'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
