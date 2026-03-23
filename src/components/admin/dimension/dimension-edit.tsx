'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input, TextArea } from '@/ui';
import type {
  Dimension,
  DimensionCategory,
  DimensionDataType,
  DimensionFormState,
} from '@/types/dimension-type';
import type { IntakeForm } from '@/types/question-type';
import styles from '@/styles/admin/dimensions/dimension-form.module.css';

type FormAction = (
  prevState: DimensionFormState,
  formData: FormData
) => Promise<DimensionFormState>;

const EMPTY_STATE: DimensionFormState = { errors: {} };
const DATA_TYPES: DimensionDataType[] = ['numeric', 'text'];
const FORM_OPTIONS: Array<{ value: IntakeForm; label: string }> = [
  { value: 'REQUEST', label: 'LEADER' },
  { value: 'MEMBER', label: 'MEMBER' },
  { value: 'ASSESS', label: 'ASSESS' },
  { value: 'EXPERIENCE', label: 'EXPERIENCE' },
];

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

type OptionDraft = {
  id: string;
  label: string;
  value: string;
};

function createOptionDraft(label = '', value = ''): OptionDraft {
  return {
    id: crypto.randomUUID(),
    label,
    value,
  };
}

function DimensionFormBody({
  action,
  isEdit,
  initial,
  categories,
  onSuccess,
  onClose,
}: Readonly<FormBodyProps>) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);
  const formFieldId = useId();
  let submitLabel = 'Create Dimension';
  const [dataType, setDataType] = useState<DimensionDataType>(
    (initial?.dataType as DimensionDataType) ?? 'numeric'
  );
  const [hardFilter, setHardFilter] = useState<boolean>(
    Boolean(initial?.hardFilter)
  );
  const [options, setOptions] = useState<OptionDraft[]>(
    initial?.options?.map(opt => ({
      id: crypto.randomUUID(),
      label: opt.label,
      value: opt.value,
    })) ?? [createOptionDraft()]
  );
  const [selectedForms, setSelectedForms] = useState<IntakeForm[]>(
    initial?.formNames ?? []
  );
  const indexNameId = `${formFieldId}-index-name`;
  const categoryId = `${formFieldId}-category`;
  const formNameLegendId = `${formFieldId}-form-name`;
  const dataTypeLegendId = `${formFieldId}-data-type`;
  const allowedOptionsId = `${formFieldId}-allowed-options`;

  if (isPending) {
    submitLabel = 'Saving…';
  } else if (isEdit) {
    submitLabel = 'Save Changes';
  }

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  function addOption() {
    setOptions(prev => [...prev, createOptionDraft()]);
  }

  function removeOption(index: number) {
    setOptions(prev =>
      prev.length === 1
        ? [createOptionDraft()]
        : prev.filter((_, i) => i !== index)
    );
  }

  function updateOption(
    index: number,
    field: keyof OptionDraft,
    value: string
  ) {
    setOptions(prev =>
      prev.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    );
  }

  function toggleFormName(formName: IntakeForm) {
    setSelectedForms(prev =>
      prev.includes(formName)
        ? prev.filter(item => item !== formName)
        : [...prev, formName]
    );
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
          <label
            htmlFor={indexNameId}
            className="block text-body font-bold text-foreground/65 uppercase tracking-wider mb-2"
          >
            Dimension Name <span className="text-red-500">*</span>
          </label>
          <input
            id={indexNameId}
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
          <label
            htmlFor={categoryId}
            className="block text-body font-bold text-foreground/75 mb-2"
          >
            CATEGORY <span className="text-magenta">*</span>
          </label>
          <select
            id={categoryId}
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

        <fieldset>
          <legend
            id={formNameLegendId}
            className="block text-body font-bold text-foreground/75 mb-2"
          >
            FORM NAME
          </legend>
          <div className="flex flex-wrap gap-2">
            {FORM_OPTIONS.map(option => {
              const checked = selectedForms.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-body font-semibold transition-colors ${
                    checked
                      ? 'border-teal-300 bg-teal-50 text-teal-800'
                      : 'border-gray-200 bg-white text-foreground/70 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="formName"
                    value={option.value}
                    checked={checked}
                    onChange={() => toggleFormName(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-300"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-caption text-foreground/45">
            Select which intake forms should use this dimension.
          </p>
        </fieldset>

        <fieldset>
          <legend
            id={dataTypeLegendId}
            className="block text-body font-bold text-foreground/75"
          >
            DATA TYPE <span className="text-red-500">*</span>
          </legend>
          <div className="mb-2 mt-2 flex items-center justify-between gap-3">
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
        </fieldset>

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
          <p
            id={allowedOptionsId}
            className="text-body font-bold text-foreground/75"
          >
            ALLOWED OPTIONS
          </p>
          <div className="mt-2 space-y-2">
            {options.map((option, index) => (
              <div
                key={option.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
              >
                <input
                  type="text"
                  value={option.label}
                  onChange={e => updateOption(index, 'label', e.target.value)}
                  placeholder="Option label"
                  className="min-w-0 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-body outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30"
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={e => updateOption(index, 'value', e.target.value)}
                  placeholder="Option value"
                  className="min-w-0 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-body outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30"
                />
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-white px-3 text-gray-400 transition-colors hover:text-red-500"
                  onClick={() => removeOption(index)}
                  title="Remove option"
                  aria-label="Remove option"
                >
                  ×
                </button>
                <input type="hidden" name="optionLabel" value={option.label} />
                <input type="hidden" name="optionValue" value={option.value} />
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
              + add option
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
          {submitLabel}
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
}: Readonly<Props>) {
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
