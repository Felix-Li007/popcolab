'use client';

import { useState, useTransition } from 'react';
import { updateUserAction } from '@/actions/user-actions';
import {
  normalizeWorkMode,
  WORK_MODE_OPTIONS,
  type WorkMode,
} from '@/constants/work-mode';
import {
  USER_STATUS_BADGE,
  USER_STATUS_OPTIONS,
} from '@/constants/user-status';
import type {
  AdminUserEditableUpdateErrors,
  AdminUserEditableUpdateInput,
  AdminUserListItem,
  UserStatus,
} from '@/types/user-type';
import UserAvatarPreview from '@/components/admin/user/avatar-preview';
import ModalShell from '@/components/shared/modal-shell';
import { Badge, Button } from '@/ui';
import styles from '@/styles/admin/users/user-edit.module.css';

type Props = {
  user: AdminUserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (
    userId: number,
    payload: AdminUserEditableUpdateInput
  ) => void;
};

type UserEditFormProps = {
  user: AdminUserListItem;
  onCancel: () => void;
  onSaved: (payload: AdminUserEditableUpdateInput) => void;
};

type PreferredContactValue = '' | 'email' | 'phone';
type WorkModeValue = '' | WorkMode;

type EditFormState = {
  userName: string;
  status: AdminUserListItem['status'];
  firstName: string;
  lastName: string;
  phoneNumber: string;
  preferredContact: PreferredContactValue;
  companyName: string;
  departmentName: string;
  roleTitle: string;
  companySize: string;
  companyWebsite: string;
  workMode: WorkModeValue;
};

const MAIN_INPUT_FIELDS: Array<{
  key: 'firstName' | 'lastName' | 'phoneNumber';
  label: string;
}> = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'phoneNumber', label: 'Phone' },
];

const PREFERRED_CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const;

const CORPORATE_FIELDS: Array<{
  key:
    | 'companyName'
    | 'departmentName'
    | 'roleTitle'
    | 'companySize'
    | 'companyWebsite'
    | 'workMode';
  label: string;
  inputType?: 'text' | 'number' | 'url';
}> = [
  { key: 'companyName', label: 'Company Name' },
  { key: 'departmentName', label: 'Department' },
  { key: 'roleTitle', label: 'Role' },
  { key: 'companySize', label: 'Company Size', inputType: 'number' },
  { key: 'companyWebsite', label: 'Company Website', inputType: 'url' },
  { key: 'workMode', label: 'Work Mode' },
];

function getUserName(user: AdminUserListItem): string {
  return user.userName.trim() || 'No username';
}

function normalizePreferredContact(
  value: string | null | undefined
): PreferredContactValue {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return normalized === 'email' || normalized === 'phone' ? normalized : '';
}

function toNullableTrimmed(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function buildForm(user: AdminUserListItem): EditFormState {
  return {
    userName: user.userName ?? '',
    status: user.status,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phoneNumber: user.phoneNumber ?? '',
    preferredContact: normalizePreferredContact(user.preferredContact),
    companyName: user.companyName ?? '',
    departmentName: user.departmentName ?? '',
    roleTitle: user.roleTitle ?? '',
    companySize:
      user.companySize === null || user.companySize === undefined
        ? ''
        : String(user.companySize),
    companyWebsite: user.companyWebsite ?? '',
    workMode: user.workMode ?? '',
  };
}

function toUpdatePayload(form: EditFormState): AdminUserEditableUpdateInput {
  const normalizedCompanySize = toNullableTrimmed(form.companySize);
  const companySize = normalizedCompanySize
    ? Number.parseInt(normalizedCompanySize, 10)
    : null;

  return {
    userName: form.userName.trim(),
    status: form.status,
    firstName: toNullableTrimmed(form.firstName),
    lastName: toNullableTrimmed(form.lastName),
    phoneNumber: toNullableTrimmed(form.phoneNumber),
    preferredContact: form.preferredContact || null,
    companyName: toNullableTrimmed(form.companyName),
    departmentName: toNullableTrimmed(form.departmentName),
    roleTitle: toNullableTrimmed(form.roleTitle),
    companySize:
      companySize !== null && Number.isInteger(companySize)
        ? companySize
        : null,
    companyWebsite: toNullableTrimmed(form.companyWebsite),
    workMode: normalizeWorkMode(form.workMode),
  };
}

function UserEditFormContent({ user, onCancel, onSaved }: UserEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<EditFormState>(() => buildForm(user));
  const [fieldErrors, setFieldErrors] = useState<AdminUserEditableUpdateErrors>(
    {}
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleFieldChange<K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K]
  ) {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }

  function handleFormAction() {
    if (isPending) return;

    setFieldErrors({});
    setSubmitError(null);

    const payload = toUpdatePayload(form);
    startTransition(async () => {
      try {
        const result = await updateUserAction(user.id, payload);
        if (!result.success) {
          setFieldErrors(result.fieldErrors ?? {});
          setSubmitError(result.error ?? 'Failed to update user.');
          return;
        }

        onSaved(payload);
      } catch {
        setSubmitError('Failed to update user. Please try again.');
      }
    });
  }

  function getFieldMeta<K extends keyof EditFormState>(key: K) {
    const inputId = `user-edit-${user.id}-${key}`;
    const error = fieldErrors[key];
    const errorId = error ? `${inputId}-error` : undefined;

    return {
      inputId,
      error,
      errorId,
      hasError: Boolean(error),
    };
  }

  const userNameMeta = getFieldMeta('userName');
  const statusMeta = getFieldMeta('status');
  const preferredContactMeta = getFieldMeta('preferredContact');

  return (
    <form
      className={styles.form}
      action={handleFormAction}
      data-testid="user-edit-form"
    >
      <div className={styles.grid}>
        <div className={`${styles.infoCard} ${styles.tile1}`}>
          <p className={styles.label}>Avatar</p>
          <div className={styles.avatarCenter}>
            <UserAvatarPreview user={user} />
          </div>
        </div>

        <div className={styles.infoCard}>
          <label htmlFor={userNameMeta.inputId} className={styles.label}>
            User Name
          </label>
          <input
            id={userNameMeta.inputId}
            value={form.userName}
            onChange={event =>
              handleFieldChange('userName', event.target.value)
            }
            className={styles.input}
            disabled={isPending}
            aria-invalid={userNameMeta.hasError}
            aria-describedby={userNameMeta.errorId}
          />
          {userNameMeta.error && (
            <p id={userNameMeta.errorId} className={styles.fieldError}>
              {userNameMeta.error}
            </p>
          )}
        </div>

        <div className={styles.infoCard}>
          <label htmlFor={statusMeta.inputId} className={styles.label}>
            Status
          </label>
          <select
            id={statusMeta.inputId}
            value={form.status}
            onChange={event =>
              handleFieldChange('status', event.target.value as UserStatus)
            }
            className={styles.select}
            disabled={isPending}
            aria-invalid={statusMeta.hasError}
            aria-describedby={statusMeta.errorId}
          >
            {USER_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {statusMeta.error && (
            <p id={statusMeta.errorId} className={styles.fieldError}>
              {statusMeta.error}
            </p>
          )}
        </div>

        {MAIN_INPUT_FIELDS.map(field => {
          const meta = getFieldMeta(field.key);
          return (
            <div key={field.key} className={styles.infoCard}>
              <label htmlFor={meta.inputId} className={styles.label}>
                {field.label}
              </label>
              <input
                id={meta.inputId}
                value={form[field.key]}
                onChange={event =>
                  handleFieldChange(field.key, event.target.value)
                }
                className={styles.input}
                disabled={isPending}
                aria-invalid={meta.hasError}
                aria-describedby={meta.errorId}
              />
              {meta.error && (
                <p id={meta.errorId} className={styles.fieldError}>
                  {meta.error}
                </p>
              )}
            </div>
          );
        })}

        <div className={styles.infoCard}>
          <label
            htmlFor={preferredContactMeta.inputId}
            className={styles.label}
          >
            Preferred Contact
          </label>
          <select
            id={preferredContactMeta.inputId}
            value={form.preferredContact}
            onChange={event =>
              handleFieldChange(
                'preferredContact',
                event.target.value as PreferredContactValue
              )
            }
            className={styles.select}
            disabled={isPending}
            aria-invalid={preferredContactMeta.hasError}
            aria-describedby={preferredContactMeta.errorId}
          >
            <option value="">Select contact method</option>
            {PREFERRED_CONTACT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {preferredContactMeta.error && (
            <p id={preferredContactMeta.errorId} className={styles.fieldError}>
              {preferredContactMeta.error}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className={styles.sectionTitle}>Company</p>
        <div className={styles.sectionCard}>
          <div className={styles.corporateGrid}>
            {CORPORATE_FIELDS.map(field => {
              const meta = getFieldMeta(field.key);
              return (
                <div key={field.key} className={styles.corporateItem}>
                  <label
                    htmlFor={meta.inputId}
                    className={styles.corporateLabel}
                  >
                    {field.label}
                  </label>
                  {field.key === 'workMode' ? (
                    <select
                      id={meta.inputId}
                      value={form.workMode}
                      onChange={event =>
                        handleFieldChange(
                          'workMode',
                          event.target.value as WorkModeValue
                        )
                      }
                      className={styles.select}
                      disabled={isPending}
                      aria-invalid={meta.hasError}
                      aria-describedby={meta.errorId}
                    >
                      <option value="">Select work mode</option>
                      {WORK_MODE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={meta.inputId}
                      value={form[field.key]}
                      type={field.inputType ?? 'text'}
                      min={field.inputType === 'number' ? 1 : undefined}
                      step={field.inputType === 'number' ? 1 : undefined}
                      onChange={event =>
                        handleFieldChange(field.key, event.target.value)
                      }
                      className={styles.input}
                      disabled={isPending}
                      aria-invalid={meta.hasError}
                      aria-describedby={meta.errorId}
                    />
                  )}
                  {meta.error && (
                    <p id={meta.errorId} className={styles.fieldError}>
                      {meta.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {submitError && <p className={styles.formError}>{submitError}</p>}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: Props) {
  if (!isOpen || !user) return null;

  const statusBadge = USER_STATUS_BADGE[user.status];
  const userName = getUserName(user);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={userName}
      subtitle={user.email}
      headerMeta={
        <Badge size="xs" variant={statusBadge.variant}>
          {statusBadge.label}
        </Badge>
      }
      rootTestId="user-detail-modal-root"
      panelTestId="user-detail-modal"
    >
      <div data-testid="user-detail-edit-body">
        <UserEditFormContent
          key={`${user.id}-${user.updatedAt}`}
          user={user}
          onCancel={onClose}
          onSaved={payload => {
            onUserUpdated?.(user.id, payload);
            onClose();
          }}
        />
      </div>
    </ModalShell>
  );
}
