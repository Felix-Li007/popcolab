'use client';

import { useActionState, useEffect, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input, TextArea } from '@/ui';
import type {
  Dimension,
  DimensionCategory,
  DimensionDataType,
  DimensionFormState,
} from '@/types/dimension-type';
import styles from '@/styles/dimension-form.module.css';

type FormAction = (
  prevState: DimensionFormState,
  formData: FormData
) => Promise<DimensionFormState>;

const EMPTY_STATE: DimensionFormState = { errors: {} };
const DATA_TYPES: DimensionDataType[] = ['numeric', 'text'];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: Dimension;
  categories: DimensionCategory[];
  onSuccess: () => void;
};

type FormBodyProps = {
  action: FormAction;
  isEdit: boolean;
  initial?: Dimension;
  categories: DimensionCategory[];
  onSuccess: () => void;
  onClose: () => void;
};

function DimensionFormBody({
  action,
  isEdit,
  initial,
  categories,
  onSuccess,
  onClose,
}: FormBodyProps) {
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
    <form action={formAction} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
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
          <div className="mt-2 grid grid-cols-2 gap-2">
            {options.map((option, index) => (
              <div
                key={index}
                className="flex w-full min-w-0 items-stretch rounded-xl border border-gray-200 bg-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-magenta/30"
              >
                <input
                  type="text"
                  value={option}
                  onChange={e => updateOption(index, e.target.value)}
                  placeholder="Allowed value"
                  className="min-w-0 flex-1 px-3 py-2 text-body bg-transparent outline-none"
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
          </div>
          <div className="mt-2">
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

      <div className="border-t border-gray-100 flex items-center justify-end gap-3 px-6 py-4 shrink-0">
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
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Dimension'}
        </Button>
      </div>
    </form>
  );
}

export default function DimensionForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  categories,
  onSuccess,
}: Props) {
  if (!isOpen) return null;

  const formKey = `${isEdit ? (initial?.id ?? 'edit') : 'new'}-${categories.length}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-title leading-none">
            {isEdit ? '✏️' : '📐'}
          </span>
          <span>{isEdit ? 'Edit Dimension' : 'New Dimension'}</span>
        </div>
      }
      subtitle={isEdit && initial?.id ? `#${initial.id}` : undefined}
      panelClassName={styles.panel}
      bodyClassName={styles.body}
      rootTestId="dimension-form-modal-root"
      panelTestId="dimension-form-modal"
    >
      <DimensionFormBody
        key={formKey}
        action={action}
        isEdit={isEdit}
        initial={initial}
        categories={categories}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    </ModalShell>
  );
}
