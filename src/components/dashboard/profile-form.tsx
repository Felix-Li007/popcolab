'use client';

import { useState, useTransition } from 'react';
import { updateProfileAction } from '@/actions/profile-actions';
import type { UserProfileData } from '@/actions/profile-actions';

const PREFERRED_CONTACT_OPTIONS = [
  { value: '', label: 'Select preference' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

export default function ProfileForm({ data }: { data: UserProfileData }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    userName: data.userName ?? '',
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    phoneNumber: data.phoneNumber ?? '',
    preferredContact: data.preferredContact ?? '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? 'Something went wrong.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Email address
        </label>
        <input
          type="email"
          value={data.email}
          readOnly
          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Managed via your account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-xs font-semibold text-gray-600 mb-1"
          >
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={handleChange}
            placeholder="First name"
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-deep/30 focus:border-teal-deep transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-xs font-semibold text-gray-600 mb-1"
          >
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={handleChange}
            placeholder="Last name"
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-deep/30 focus:border-teal-deep transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="userName"
          className="block text-xs font-semibold text-gray-600 mb-1"
        >
          Username
        </label>
        <input
          id="userName"
          name="userName"
          type="text"
          value={values.userName}
          onChange={handleChange}
          required
          maxLength={50}
          placeholder="Username"
          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-deep/30 focus:border-teal-deep transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-xs font-semibold text-gray-600 mb-1"
        >
          Phone number
        </label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={values.phoneNumber}
          onChange={handleChange}
          placeholder="e.g. 204-555-0100"
          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-deep/30 focus:border-teal-deep transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="preferredContact"
          className="block text-xs font-semibold text-gray-600 mb-1"
        >
          Preferred contact method
        </label>
        <select
          id="preferredContact"
          name="preferredContact"
          value={values.preferredContact}
          onChange={handleChange}
          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-deep/30 focus:border-teal-deep transition-colors bg-white"
        >
          {PREFERRED_CONTACT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          Profile saved successfully.
        </p>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-teal-deep text-white text-sm font-semibold rounded-lg hover:bg-teal-deep/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
