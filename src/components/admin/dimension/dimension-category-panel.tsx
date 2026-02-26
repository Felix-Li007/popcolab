'use client';

import { useActionState, useEffect } from 'react';
import { Button, Input, TextArea } from '@/ui';
import type {
  DimensionCategory,
  DimensionCategoryFormState,
} from '@/types/dimension-type';

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
};

export default function DimensionCategoryPanel({
  action,
  isEdit = false,
  initial,
  usageCount = 0,
  onSuccess,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 shrink-0">
        <div className="flex items-center gap-2">
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

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {state.errors._form && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-body px-4 py-2 rounded-xl">
            {state.errors._form}
          </div>
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

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide">
            Linked Dimensions
          </p>
          <p className="text-heading font-semibold text-foreground/80 mt-0.5">
            {usageCount}
          </p>
          {usageCount > 0 && (
            <p className="text-caption text-amber-600 mt-1">
              Delete is blocked while this category is in use.
            </p>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
