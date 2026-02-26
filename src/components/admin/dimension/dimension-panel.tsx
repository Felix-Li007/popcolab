'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button, Input, TextArea } from '@/ui';
import type {
  Dimension,
  DimensionCategory,
  DimensionDataType,
  DimensionFormState,
} from '@/types/dimension-type';

const EMPTY_STATE: DimensionFormState = { errors: {} };

type FormAction = (
  prevState: DimensionFormState,
  formData: FormData
) => Promise<DimensionFormState>;

type Props = {
  action: FormAction;
  isEdit?: boolean;
  initial?: Dimension;
  categories: DimensionCategory[];
  onSuccess: () => void;
  onCancel?: () => void;
};

const DATA_TYPES: DimensionDataType[] = ['numeric', 'text'];

export default function DimensionPanel({
  action,
  isEdit = false,
  initial,
  categories,
  onSuccess,
  onCancel,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);
  const [dataType, setDataType] = useState<DimensionDataType>(
    (initial?.dataType as DimensionDataType) ?? 'numeric'
  );
  const [hardFilter, setHardFilter] = useState<boolean>(
    Boolean(initial?.hardFilter)
  );
  const [options, setOptions] = useState<string[]>(
    initial?.options?.map(opt => opt.value) ?? ['']
  );

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  function addOption() {
    setOptions(prev => [...prev, '']);
  }

  function removeOption(index: number) {
    setOptions(prev => prev.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    setOptions(prev => prev.map((v, i) => (i === index ? value : v)));
  }

  return (
    <form action={formAction} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 bg-linear-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-title leading-none">
            {isEdit ? '✏️' : '📐'}
          </span>
          <h3 className="text-heading font-bold text-foreground">
            {isEdit ? 'Edit Dimension' : 'New Dimension'}
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

        <div>
          <label className="block text-body font-bold text-foreground/65 uppercase tracking-wider mb-2">
            Dimension Name <span className="text-red-500">*</span>
          </label>
          <input
            name="indexName"
            type="text"
            placeholder="e.g. Team Collaboration"
            defaultValue={initial?.indexName ?? ''}
            className={`w-full font-semibold text-foreground rounded-2xl bg-gray-100 border-0 outline-none px-3 py-2 text-body placeholder:font-normal placeholder:text-foreground/45 transition focus:ring-2 focus:ring-magenta/30 focus:bg-white ${
              state.errors.indexName ? 'ring-2 ring-red-300 bg-red-50' : ''
            }`}
            required
          />
          {state.errors.indexName && (
            <p className="text-badge text-red-500 mt-1">
              {state.errors.indexName}
            </p>
          )}
        </div>

        <TextArea
          name="indexNotes"
          label="Notes"
          placeholder="Optional notes for scoring or interpretation..."
          defaultValue={initial?.indexNotes ?? ''}
          inputSize="sm"
          rows={2}
        />

        <div>
          <label className="block text-body font-bold text-foreground/75 mb-2">
            CATEGORY <span className="text-magenta">*</span>
          </label>
          <select
            name="categoryId"
            title="Dimension category"
            aria-label="Dimension category"
            defaultValue={String(initial?.categoryId ?? '')}
            className="w-full px-3 py-2 text-body bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold text-foreground"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {state.errors.categoryId && (
            <p className="text-body text-red-500 mt-1">
              {state.errors.categoryId}
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-body font-bold text-foreground/75">
              DATA TYPE <span className="text-red-500">*</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <span className="text-caption font-semibold text-foreground/75">
                Hard Filter
              </span>
              <input
                type="checkbox"
                name="hardFilter"
                checked={hardFilter}
                onChange={e => setHardFilter(e.target.checked)}
                className="sr-only peer"
              />
              <span className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-teal-deep transition-colors relative">
                <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
              </span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {DATA_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setDataType(type)}
                className={`px-3 py-2 rounded-xl border text-body font-semibold transition-all ${
                  dataType === type
                    ? 'border-magenta bg-magenta/5 text-magenta'
                    : 'border-gray-200 text-foreground/75 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <input type="hidden" name="dataType" value={dataType} />
          {state.errors.dataType && (
            <p className="text-body text-red-500 mt-1">
              {state.errors.dataType}
            </p>
          )}
        </div>

        {dataType === 'scale' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="scaleMin"
              label="Scale Min"
              type="number"
              defaultValue={initial?.scaleMin ?? ''}
              error={state.errors.scaleMin}
              inputSize="sm"
              required
            />
            <Input
              name="scaleMax"
              label="Scale Max"
              type="number"
              defaultValue={initial?.scaleMax ?? ''}
              error={state.errors.scaleMax}
              inputSize="sm"
              required
            />
          </div>
        )}

        <div>
          <label className="text-body font-bold text-foreground/75">
            ALLOW VALUE
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {options.map((option, index) => (
              <div
                key={index}
                className="inline-flex items-stretch rounded-xl border border-gray-200 bg-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-magenta/30"
              >
                <input
                  type="text"
                  value={option}
                  onChange={e => updateOption(index, e.target.value)}
                  placeholder="Allowed value"
                  className="w-32 sm:w-36 md:w-40 px-3 py-2 text-body bg-transparent outline-none"
                />
                <input type="hidden" name="optionValue" value={option} />
                {options.length > 1 && (
                  <button
                    type="button"
                    className="px-2 text-gray-400 hover:text-red-500 border-l border-gray-200 bg-white/70 transition-colors"
                    onClick={() => removeOption(index)}
                    title="Remove option"
                    aria-label="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="!h-9 !min-w-0 !px-3 whitespace-nowrap !rounded-xl !border !border-dashed !border-gray-300 !bg-transparent !text-gray-500 hover:!border-magenta/40 hover:!text-magenta hover:!bg-magenta/5"
              onClick={addOption}
            >
              + add value
            </Button>
          </div>
          {state.errors.options && (
            <p className="text-body text-red-500 mt-1">
              {state.errors.options}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
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
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Dimension'}
        </Button>
      </div>
    </form>
  );
}
