'use client';

import { useActionState, useEffect } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input, TextArea } from '@/ui';
import type {
  DimensionCategory,
  DimensionCategoryFormState,
} from '@/types/dimension-type';
import styles from '@/styles/category-form.module.css';

type FormAction = (
  prevState: DimensionCategoryFormState,
  formData: FormData
) => Promise<DimensionCategoryFormState>;

const EMPTY_STATE: DimensionCategoryFormState = { errors: {} };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: DimensionCategory;
  usageCount?: number;
  onSuccess: () => void;
};

type FormBodyProps = {
  action: FormAction;
  isEdit: boolean;
  initial?: DimensionCategory;
  usageCount: number;
  onSuccess: () => void;
  onClose: () => void;
};

function CategoryFormBody({
  action,
  isEdit,
  initial,
  usageCount,
  onSuccess,
  onClose,
}: FormBodyProps) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.content}>
        {state.errors._form && (
          <div className={styles.formError}>{state.errors._form}</div>
        )}

        <Input
          name="name"
          label="Category Name"
          placeholder="e.g. Team Dynamics"
          defaultValue={initial?.name ?? ''}
          error={state.errors.name}
          inputSize="sm"
          required
        />

        <TextArea
          name="description"
          label="Description"
          placeholder="Optional description for this category..."
          defaultValue={initial?.description ?? ''}
          error={state.errors.description}
          rows={3}
          inputSize="sm"
        />

        <div className={styles.usageBox}>
          <p className={styles.usageLabel}>Linked Dimensions</p>
          <p className={styles.usageValue}>{usageCount}</p>
          {usageCount > 0 ? (
            <p className={styles.usageHint}>
              Delete is blocked while this category is in use.
            </p>
          ) : null}
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
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}

export default function DimensionCategoryForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  usageCount = 0,
  onSuccess,
}: Props) {
  if (!isOpen) return null;

  const formKey = `${isEdit ? (initial?.id ?? 'edit') : 'new'}-${usageCount}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-title leading-none">
            {isEdit ? '✏️' : '🗂️'}
          </span>
          <span>{isEdit ? 'Edit Category' : 'New Category'}</span>
        </div>
      }
      subtitle={isEdit && initial?.id ? `#${initial.id}` : undefined}
      panelClassName={styles.panel}
      bodyClassName={styles.body}
      rootTestId="category-form-modal-root"
      panelTestId="category-form-modal"
    >
      <CategoryFormBody
        key={formKey}
        action={action}
        isEdit={isEdit}
        initial={initial}
        usageCount={usageCount}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    </ModalShell>
  );
}
