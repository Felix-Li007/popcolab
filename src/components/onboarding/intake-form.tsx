'use client';

import { useActionState } from 'react';
import {
  submitIntakeFormAction,
  type IntakeFormState,
} from '@/actions/intake-actions';

const PRONOUNS_OPTIONS = [
  'She / Her',
  'He / Him',
  'They / Them',
  'Prefer not to say',
];

const initialState: IntakeFormState = {};

export default function IntakeForm() {
  const [state, formAction, pending] = useActionState(
    submitIntakeFormAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* First / Last name row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            First name
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
              Required
            </span>
          </label>
          <input
            name="firstName"
            type="text"
            placeholder="Sarah"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C]"
          />
          {state.errors?.firstName && (
            <p className="text-[11px] text-red-600">{state.errors.firstName}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Last name
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
              Required
            </span>
          </label>
          <input
            name="lastName"
            type="text"
            placeholder="Johnson"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C]"
          />
          {state.errors?.lastName && (
            <p className="text-[11px] text-red-600">{state.errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Username
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
            Required
          </span>
        </label>
        <input
          name="userName"
          type="text"
          placeholder="@sarahjohnson — used so teammates can invite you"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C]"
        />
        <p className="text-[10px] text-gray-400">
          Your @username is how others find and invite you to teams
        </p>
        {state.errors?.userName && (
          <p className="text-[11px] text-red-600">{state.errors.userName}</p>
        )}
      </div>

      {/* Job role / Department row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Job role
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
              Required
            </span>
          </label>
          <input
            name="jobRole"
            type="text"
            placeholder="e.g. UX Designer"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C]"
          />
          {state.errors?.jobRole && (
            <p className="text-[11px] text-red-600">{state.errors.jobRole}</p>
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
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C]"
          />
        </div>
      </div>

      {/* Pronouns */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Pronouns
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
            Optional
          </span>
        </label>
        <select
          name="pronouns"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C]"
        >
          <option value="">Select…</option>
          {PRONOUNS_OPTIONS.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => history.back()}
          className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-[2] rounded-lg bg-[#E91E8C] py-2.5 text-sm font-semibold text-white hover:bg-[#c7177a] disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Next: Personality Test →'}
        </button>
      </div>
    </form>
  );
}
