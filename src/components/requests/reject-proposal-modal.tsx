'use client';

import { useActionState, useEffect, useRef } from 'react';
import {
  rejectProposalAction,
  type RejectProposalState,
} from '@/actions/request-actions';

type Props = {
  open: boolean;
  onClose: () => void;
  proposalId: number | null;
  requestTitle: string;
};

const initial: RejectProposalState = {};

const REASONS = [
  "Date doesn't work for our team",
  "Experience doesn't match what we need",
  'Participant count is off',
  'Budget concerns',
  'Other',
];

export default function RejectProposalModal({
  open,
  onClose,
  proposalId,
  requestTitle,
}: Props) {
  const [state, formAction, pending] = useActionState(
    rejectProposalAction,
    initial
  );
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

  if (!open || proposalId === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-red-900 px-6 py-4">
          <h2 className="text-base font-bold text-white">
            ✕ Reject Approved Proposal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-red-300 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form action={formAction}>
          <input type="hidden" name="proposalId" value={proposalId} />

          <div className="p-6 flex flex-col gap-4">
            {/* Context */}
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-xs font-semibold text-red-800">
                Rejecting: {requestTitle}
              </p>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Reason
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 normal-case">
                  Required
                </span>
              </label>
              <select
                name="reason"
                defaultValue=""
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-red-400 focus:bg-white"
              >
                <option value="" disabled>
                  Select a reason…
                </option>
                {REASONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.reason && (
                <p className="text-[11px] text-red-600">
                  {state.fieldErrors.reason}
                </p>
              )}
            </div>

            {/* Feedback */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Feedback for admin
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500 normal-case">
                  Optional
                </span>
              </label>
              <textarea
                name="feedback"
                rows={3}
                placeholder="Help admin understand what to change so they can revise or you can resubmit a better request…"
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-red-400 focus:bg-white resize-none"
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {state.error}
              </p>
            )}
          </div>

          {/* Footer */}
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
              disabled={pending}
              className="rounded-lg bg-red-800 px-5 py-2 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Send Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
