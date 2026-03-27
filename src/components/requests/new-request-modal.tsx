'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createRequestAction,
  type CreateRequestState,
} from '@/actions/request-actions';

const EVENT_TYPES = [
  'Team Bonding',
  'Team Building',
  'Team Development',
  'Birthday Party',
  'Staff Party',
  'Group Of Friends Getting Together',
  'Date Night',
  'Retirement Party',
  'Hosting Clients',
  'Family Get Together',
];

function generateTimeOptions() {
  const options: { value: string; label: string }[] = [];
  for (let h = 8; h <= 16; h++) {
    for (const m of [0, 30]) {
      if (h === 16 && m === 30) break;
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${m === 0 ? '00' : '30'} ${ampm}`;
      const value = `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

const TEAM_OBJECTIVES = [
  'Strengthen team connections',
  'Spark creativity',
  'Boost morale',
  'Improve communication',
  'Encourage collaboration',
  'Try something new together',
  'Support wellness & balance',
  'Celebrate a milestone',
  'Just have fun!',
  'Other',
];

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const initial: CreateRequestState = {};

export default function NewRequestModal({ open, onClose }: Props) {
  const [state, formAction, pending] = useActionState(
    createRequestAction,
    initial
  );
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
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

  function toggleEventType(type: string) {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  function toggleObjective(obj: string) {
    setSelectedObjectives(prev =>
      prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
    );
  }

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
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
          {/* Hidden: serialised multi-selects */}
          <input
            type="hidden"
            name="eventTypes"
            value={selectedEventTypes.join(',')}
          />
          <input
            type="hidden"
            name="objectives"
            value={selectedObjectives.join(',')}
          />

          <div className="p-6 flex flex-col gap-6">
            {/* Q1 — Event type */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                What type of event are you looking to create experiences for?{' '}
                <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-col gap-2">
                {EVENT_TYPES.map(type => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEventTypes.includes(type)}
                      onChange={() => toggleEventType(type)}
                      className="accent-[#E91E8C] w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
              {state.fieldErrors?.eventTypes && (
                <p className="mt-1.5 text-[11px] text-red-600">
                  {state.fieldErrors.eventTypes}
                </p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Q2 — Team objectives */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Team Objective(s).{' '}
                <span className="font-normal text-gray-500">
                  Choose multiple options if more than one objective.
                </span>{' '}
                <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-col gap-2 mt-3">
                {TEAM_OBJECTIVES.map(obj => (
                  <label
                    key={obj}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedObjectives.includes(obj)}
                      onChange={() => toggleObjective(obj)}
                      className="accent-[#E91E8C] w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{obj}</span>
                  </label>
                ))}
              </div>
              {state.fieldErrors?.objectives && (
                <p className="mt-1.5 text-[11px] text-red-600">
                  {state.fieldErrors.objectives}
                </p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Q3 — Anything else */}
            <div>
              <label
                htmlFor="anythingElse"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Anything else we should know?
              </label>
              <textarea
                id="anythingElse"
                name="anythingElse"
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white resize-none"
              />
            </div>

            <hr className="border-gray-100" />

            {/* Q4 — Budget */}
            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                What is your estimated budget range?{' '}
                <span className="font-normal text-gray-500">
                  Let us know your total budget or per person or both.
                </span>{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="budget"
                type="text"
                name="budget"
                placeholder="e.g. $500–$1,000 total or $50 per person"
                className="w-full mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
              />
              {state.fieldErrors?.budget && (
                <p className="mt-1 text-[11px] text-red-600">
                  {state.fieldErrors.budget}
                </p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Q5 — Event details */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Event details <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-col gap-3">
                {/* Date */}
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                  >
                    Date
                  </label>
                  <div className="relative">
                    <input
                      id="startDate"
                      type="date"
                      name="startDate"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-9 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  {state.fieldErrors?.startDate && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {state.fieldErrors.startDate}
                    </p>
                  )}
                </div>

                {/* Start time + End time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                    >
                      Start time
                    </label>
                    <select
                      id="startTime"
                      name="startTime"
                      defaultValue=""
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                    >
                      <option value="" disabled>
                        Select a time
                      </option>
                      {TIME_OPTIONS.map(opt => (
                        <option key={`start-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                    >
                      End time
                    </label>
                    <select
                      id="endTime"
                      name="endTime"
                      defaultValue=""
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                    >
                      <option value="" disabled>
                        Select a time
                      </option>
                      {TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration + Group size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="duration"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                    >
                      Duration (hours)
                    </label>
                    <input
                      id="duration"
                      type="number"
                      name="duration"
                      min={1}
                      placeholder="e.g. 2"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="groupSize"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                    >
                      Group size <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="groupSize"
                      type="number"
                      name="groupSize"
                      min={1}
                      placeholder="e.g. 20"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                    />
                    {state.fieldErrors?.groupSize && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {state.fieldErrors.groupSize}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                  >
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    placeholder="e.g. Downtown Winnipeg"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Q6 — Proposal deadline: date + time */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Do you have a hard deadline to have a proposal in hand? If so
                what is that date and time.{' '}
                <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="eventDate"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                  >
                    Date
                  </label>
                  <div className="relative">
                    <input
                      id="eventDate"
                      type="date"
                      name="eventDate"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-9 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  {state.fieldErrors?.eventDate && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {state.fieldErrors.eventDate}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="proposalTime"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                  >
                    Time
                  </label>
                  <select
                    id="proposalTime"
                    name="proposalTime"
                    defaultValue=""
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                  >
                    <option value="" disabled>
                      Select a time
                    </option>
                    {TIME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
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
