'use client';

import { useActionState, useEffect } from 'react';
import { Button, Input, TextArea } from '@/ui';
import type {
  DimensionCategory,
  DimensionCategoryFormState,
} from '@/types/dimension-type';
import styles from '@/styles/category-panel.module.css';

const EMPTY_STATE: DimensionCategoryFormState = { errors: {} };

type FormAction = (
  prevState: DimensionCategoryFormState,
  formData: FormData
) => Promise<DimensionCategoryFormState>;

type Props = {
  action: FormAction;
  isEdit?: boolean;
  initial?: DimensionCategory;
  usageCount?: number;
  onSuccess: () => void;
  onCancel?: () => void;
};

export default function DimensionCategoryPanel({
  action,
  isEdit = false,
  initial,
  usageCount = 0,
  onSuccess,
  onCancel,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className="text-title leading-none">
            {isEdit ? '✏️' : '🗂️'}
          </span>
          <h3 className="text-heading font-bold text-foreground">
            {isEdit ? 'Edit Category' : 'New Category'}
          </h3>
          {isEdit && initial?.id && (
            <span className="text-body text-foreground/45 font-mono">
              #{initial.id}
            </span>
          )}
        </div>
      </div>

      <div className={styles.body}>
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
          {usageCount > 0 && (
            <p className={styles.usageHint}>
              Delete is blocked while this category is in use.
            </p>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
