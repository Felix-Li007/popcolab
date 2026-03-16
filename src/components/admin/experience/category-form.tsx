'use client';

import { useActionState, useEffect } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input, TextArea } from '@/ui';
import type {
  ExperienceCategory,
  ExperienceCategoryOption,
  ExperienceCategoryFormState,
} from '@/types/category-type';
import styles from '@/styles/admin/category-form.module.css';

type FormAction = (
  prevState: ExperienceCategoryFormState,
  formData: FormData
) => Promise<ExperienceCategoryFormState>;

const EMPTY_STATE: ExperienceCategoryFormState = { errors: {} };
const CATEGORY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
] as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  initial?: ExperienceCategory;
  parentOptions: ExperienceCategoryOption[];
  defaultParentId?: number | null;
  modalTitle: string;
  submitLabel: string;
  maxLevel: number;
  onSuccess: () => void;
};

type FormBodyProps = {
  action: FormAction;
  initial?: ExperienceCategory;
  parentOptions: ExperienceCategoryOption[];
  defaultParentId?: number | null;
  submitLabel: string;
  maxLevel: number;
  onSuccess: () => void;
  onClose: () => void;
};

function ExperienceCategoryFormBody({
  action,
  initial,
  parentOptions,
  defaultParentId,
  submitLabel,
  maxLevel,
  onSuccess,
  onClose,
}: FormBodyProps) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  const parentValue =
    initial?.parentId !== null && initial?.parentId !== undefined
      ? String(initial.parentId)
      : defaultParentId
        ? String(defaultParentId)
        : '';

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.content}>
        {state.errors._form && (
          <div className={styles.formError}>{state.errors._form}</div>
        )}

        <Input
          name="title"
          label="Category Title"
          placeholder="e.g. Team Building"
          defaultValue={initial?.title ?? ''}
          error={state.errors.title}
          inputSize="sm"
          required
        />

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Parent Category
          </label>
          <select
            name="parentId"
            defaultValue={parentValue}
            className={`w-full rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30 ${
              state.errors.parentId ? 'bg-red-50 ring-2 ring-red-300' : ''
            }`}
          >
            <option value="">No parent (root level)</option>
            {parentOptions.map(parent => (
              <option key={parent.id} value={parent.id}>
                {parent.label}
              </option>
            ))}
          </select>
          {state.errors.parentId ? (
            <p className="mt-1 text-[10px] text-red-500">
              {state.errors.parentId}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-gray-400">
              Supports up to {maxLevel} levels.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Status
          </label>
          <div className="relative">
            <select
              name="status"
              defaultValue={initial?.status ?? 'active'}
              title="Status"
              aria-label="Status"
              className={`w-full cursor-pointer appearance-none rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30 ${
                state.errors.status ? 'bg-red-50 ring-2 ring-red-300' : ''
              }`}
              required
            >
              {CATEGORY_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4M8 15l4 4 4-4"
                />
              </svg>
            </div>
          </div>
          {state.errors.status ? (
            <p className="mt-1 text-[10px] text-red-500">
              {state.errors.status}
            </p>
          ) : null}
        </div>

        <TextArea
          name="notes"
          label="Notes"
          placeholder="Optional notes for this category..."
          defaultValue={initial?.notes ?? ''}
          error={state.errors.notes}
          rows={4}
          inputSize="sm"
        />

        <div className={styles.usageBox}>
          <p className={styles.usageLabel}>Current Usage</p>
          <p className={styles.usageValue}>
            Children: {initial?.childCount ?? 0} · Linked:{' '}
            {initial?.linkedExperienceCount ?? 0}
          </p>
          <p className={styles.usageHint}>
            Categories with children or linked experiences cannot be deleted.
          </p>
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function ExperienceCategoryForm({
  isOpen,
  onClose,
  action,
  initial,
  parentOptions,
  defaultParentId,
  modalTitle,
  submitLabel,
  maxLevel,
  onSuccess,
}: Props) {
  if (!isOpen) return null;

  const formKey = `${initial?.id ?? 'new'}-${defaultParentId ?? 'root'}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-title leading-none">
            {initial ? '✏️' : '🗂️'}
          </span>
          <span>{modalTitle}</span>
        </div>
      }
      subtitle={initial?.id ? `#${initial.id}` : undefined}
      panelClassName={styles.panel}
      bodyClassName={styles.body}
      rootTestId="experience-category-form-root"
      panelTestId="experience-category-form"
    >
      <ExperienceCategoryFormBody
        key={formKey}
        action={action}
        initial={initial}
        parentOptions={parentOptions}
        defaultParentId={defaultParentId}
        submitLabel={submitLabel}
        maxLevel={maxLevel}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    </ModalShell>
  );
}
