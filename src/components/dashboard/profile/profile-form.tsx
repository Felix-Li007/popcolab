'use client';

import { useState, useTransition } from 'react';
import { updateProfileAction } from '@/actions/profile-actions';
import type { UserProfileData } from '@/actions/profile-actions';
import { Button } from '@/ui';
import styles from '@/styles/dashboard/profile-form.module.css';

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
    shortBio: data.shortBio ?? '',
    consentGiven: data.consentGiven,
    privacyNotes: data.privacyNotes ?? '',
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const nextValue =
      e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;
    setValues(prev => ({ ...prev, [e.target.name]: nextValue }));
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
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Email address</label>
        <input
          type="email"
          value={data.email}
          readOnly
          className={styles.readOnlyInput}
        />
        <p className={styles.hint}>Managed via your account settings.</p>
      </div>

      <div className={styles.twoColumnGrid}>
        <div className={styles.field}>
          <label htmlFor="firstName" className={styles.label}>
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={handleChange}
            placeholder="First name"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName" className={styles.label}>
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={handleChange}
            placeholder="Last name"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.twoColumnGrid}>
        <div className={styles.field}>
          <label htmlFor="phoneNumber" className={styles.label}>
            Phone number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={values.phoneNumber}
            onChange={handleChange}
            placeholder="e.g. 204-555-0100"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="preferredContact" className={styles.label}>
            Preferred contact method
          </label>
          <select
            id="preferredContact"
            name="preferredContact"
            value={values.preferredContact}
            onChange={handleChange}
            className={styles.input}
          >
            {PREFERRED_CONTACT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.twoColumnGrid}>
        <div className={styles.field}>
          <label htmlFor="shortBio" className={styles.label}>
            Short bio
          </label>
          <textarea
            id="shortBio"
            name="shortBio"
            value={values.shortBio}
            onChange={handleChange}
            rows={6}
            maxLength={255}
            placeholder="A short introduction about you, your background, or what you are focused on."
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="privacyNotes" className={styles.label}>
            Privacy notes
          </label>
          <textarea
            id="privacyNotes"
            name="privacyNotes"
            value={values.privacyNotes}
            onChange={handleChange}
            rows={6}
            maxLength={255}
            placeholder="Optional notes about privacy, contact preferences, or handling instructions"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.consentCard}>
        <span className={styles.consentTag}>Privacy</span>
        <label className={styles.consentRow}>
          <input
            name="consentGiven"
            type="checkbox"
            checked={values.consentGiven}
            onChange={handleChange}
            className={styles.consentCheckbox}
          />
          <div>
            <span className={styles.consentTitle}>Consent given</span>
            <span className={styles.consentDescription}>
              Allow Pop CoLab to use this profile information for account and
              service coordination.
            </span>
          </div>
        </label>
      </div>

      {error && <p className={styles.statusError}>{error}</p>}
      {success && (
        <p className={styles.statusSuccess}>Profile saved successfully.</p>
      )}

      <div className={styles.actions}>
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className={styles.saveButton}
        >
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
