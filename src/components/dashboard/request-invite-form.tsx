'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import {
  sendInvitationsAction,
  type SendInvitationsActionState,
} from '@/actions/invitation-actions';
import { DASHBOARD_REQUESTS_PATH } from '@/utils/url-helper';

type InviteRow = {
  id: string;
  userName: string;
  userEmail: string;
};

type ExistingInvite = {
  id: number;
  userName: string;
  userEmail: string;
  invitedStatus: string;
  respondAt: Date | null;
};

type Props = {
  requestId: number;
  existingInvites: ExistingInvite[];
};

const EMPTY_ACTION_STATE: SendInvitationsActionState = {
  status: 'idle',
  message: null,
  sentCount: 0,
  failedCount: 0,
};

function createInviteRow(): InviteRow {
  return {
    id: crypto.randomUUID(),
    userName: '',
    userEmail: '',
  };
}

export default function RequestInviteForm({
  requestId,
  existingInvites,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<InviteRow[]>([createInviteRow()]);
  const [state, formAction, isPending] = useActionState(
    async (
      prevState: SendInvitationsActionState,
      formData: FormData
    ): Promise<SendInvitationsActionState> => {
      const nextState = await sendInvitationsAction(prevState, formData);

      if (nextState.status === 'success') {
        setRows([createInviteRow()]);
        router.refresh();
      }

      return nextState;
    },
    EMPTY_ACTION_STATE
  );
  const invitationPayload = JSON.stringify(
    rows.map(({ userName, userEmail }) => ({ userName, userEmail }))
  );

  function updateRow(id: string, key: 'userName' | 'userEmail', value: string) {
    setRows(current =>
      current.map(row => (row.id === id ? { ...row, [key]: value } : row))
    );
  }

  function addRow() {
    setRows(current => [...current, createInviteRow()]);
  }

  function removeRow(id: string) {
    setRows(current =>
      current.length === 1 ? current : current.filter(row => row.id !== id)
    );
  }

  return (
    <div className="space-y-6">
      <form action={formAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="invitations" value={invitationPayload} />

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Send Invitations
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add multiple recipients. Each recipient will get an email with
                Accept and Reject options.
              </p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="rounded-full border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              Add row
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {rows.map(row => (
              <div
                key={row.id}
                className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[1fr_1fr_auto]"
              >
                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    User name
                  </span>
                  <input
                    value={row.userName}
                    onChange={event =>
                      updateRow(row.id, 'userName', event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500"
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </span>
                  <input
                    value={row.userEmail}
                    onChange={event =>
                      updateRow(row.id, 'userEmail', event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500"
                    placeholder="jane@example.com"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Sending...' : 'Send invitations'}
            </button>
            <Link
              href={DASHBOARD_REQUESTS_PATH}
              className="text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              Back to requests
            </Link>
          </div>

          {state.status === 'success' && state.message ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.message}
            </p>
          ) : null}
          {state.status === 'error' && state.message ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.message}
            </p>
          ) : null}
        </section>
      </form>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Existing Invites
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
          {existingInvites.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              No invitations sent yet.
            </div>
          ) : (
            existingInvites.map(invite => (
              <div
                key={invite.id}
                className="flex flex-col gap-1 border-b border-gray-100 px-4 py-3 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {invite.userName}
                  </p>
                  <p className="text-xs text-gray-500">{invite.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium capitalize text-gray-700">
                    {invite.invitedStatus}
                  </p>
                  <p className="text-xs text-gray-400">
                    {invite.respondAt
                      ? new Date(invite.respondAt).toLocaleString()
                      : 'Awaiting response'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
