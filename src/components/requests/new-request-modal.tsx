'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createRequestAction,
  type CreateRequestState,
} from '@/actions/request-actions';
import type { RequestFormData } from '@/services/user-request-service';

type Props = {
  open: boolean;
  onClose: () => void;
  formData: RequestFormData;
};

const initial: CreateRequestState = {};

export default function NewRequestModal({ open, onClose, formData }: Props) {
  const [state, formAction, pending] = useActionState(
    createRequestAction,
    initial
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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

  function handleCategorySelect(title: string) {
    setSelectedCategory(title);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#111827] px-6 py-4 rounded-t-2xl">
          <h2 className="text-base font-bold text-white">+ New Request</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form action={formAction}>
          {/* Hidden fields */}
          <input
            type="hidden"
            name="objectiveCategory"
            value={selectedCategory}
          />

          <div className="p-6 flex flex-col gap-5">
            {/* Step 1 — Category */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                Step 1 — Choose an experience category
              </p>
              <div className="grid grid-cols-2 gap-2">
                {formData.categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.title)}
                    className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                      selectedCategory === cat.title
                        ? 'border-[#E91E8C] bg-pink-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        selectedCategory === cat.title
                          ? 'text-[#E91E8C]'
                          : 'text-gray-800'
                      }`}
                    >
                      {cat.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Select this category
                    </p>
                  </button>
                ))}
              </div>
              {state.fieldErrors?.objectiveCategory && (
                <p className="mt-1.5 text-[11px] text-red-600">
                  {state.fieldErrors.objectiveCategory}
                </p>
              )}
            </div>

            {/* Step 2 — Details */}
            <hr className="border-gray-100" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                Step 2 — Request details
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Preferred date
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 normal-case">
                      Required
                    </span>
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                  />
                  {state.fieldErrors?.preferredDate && (
                    <p className="text-[11px] text-red-600">
                      {state.fieldErrors.preferredDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Participants
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 normal-case">
                      Required
                    </span>
                  </label>
                  <input
                    type="number"
                    name="participantCount"
                    min={1}
                    placeholder="e.g. 20"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                  />
                  {state.fieldErrors?.participantCount && (
                    <p className="text-[11px] text-red-600">
                      {state.fieldErrors.participantCount}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Budget range
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500 normal-case">
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    name="budget"
                    placeholder="e.g. $500–$1,000"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Notes for admin
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500 normal-case">
                    Optional
                  </span>
                </label>
                <textarea
                  name="notesForAdmin"
                  rows={3}
                  placeholder="Any context, preferences, or special requirements…"
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white resize-none"
                />
              </div>
            </div>

            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {state.error}
              </p>
            )}
          </div>

          {/* Footer */}
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
              {pending ? 'Submitting…' : 'Submit Request →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
