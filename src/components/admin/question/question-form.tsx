'use client';

import { useEffect, useState, useActionState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input, TextArea } from '@/ui';
import type {
  Question,
  QuestionFormState,
  QuestionType,
  DimensionIndex,
} from '@/types/question-type';
import { QUESTION_TYPE_META } from './question-card';
import styles from '@/styles/personality-form-modal.module.css';

const EMPTY_STATE: QuestionFormState = { errors: {} };

type FormAction = (
  prevState: QuestionFormState,
  formData: FormData
) => Promise<QuestionFormState>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: Question;
  availableDimensions: DimensionIndex[];
};

type OptionRow = { label: string; value: string; score: string };
type DimRow = { dimensionId: number; weight: string };

const QUESTION_TYPES: QuestionType[] = [
  'single_choice',
  'multi_choice',
  'scale',
  'text_input',
];

function defaultOptions(): OptionRow[] {
  return [
    { label: '', value: '', score: '' },
    { label: '', value: '', score: '' },
  ];
}

export default function QuestionForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  availableDimensions,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);

  const [qType, setQType] = useState<QuestionType>(
    initial?.type ?? 'single_choice'
  );
  const [options, setOptions] = useState<OptionRow[]>(
    initial?.options?.length
      ? initial.options.map(o => ({
          label: o.label,
          value: o.value,
          score: o.score != null ? String(o.score) : '',
        }))
      : defaultOptions()
  );
  const [dims, setDims] = useState<DimRow[]>(
    initial?.dimensions?.length
      ? initial.dimensions.map(d => ({
          dimensionId: d.dimensionId,
          weight: d.weight != null ? String(d.weight) : '',
        }))
      : []
  );

  const needsOptions = qType === 'single_choice' || qType === 'multi_choice';
  const isScale = qType === 'scale';

  // Grouped available dimensions by category
  const dimsByCategory = availableDimensions.reduce<
    Record<string, DimensionIndex[]>
  >((acc, d) => {
    const key = d.categoryName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  // Which dimensionIds are already selected
  const selectedIds = new Set(dims.map(d => d.dimensionId));

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQType(initial?.type ?? 'single_choice');
      setOptions(
        initial?.options?.length
          ? initial.options.map(o => ({
              label: o.label,
              value: o.value,
              score: o.score != null ? String(o.score) : '',
            }))
          : defaultOptions()
      );
      setDims(
        initial?.dimensions?.length
          ? initial.dimensions.map(d => ({
              dimensionId: d.dimensionId,
              weight: d.weight != null ? String(d.weight) : '',
            }))
          : []
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on success
  useEffect(() => {
    if (state.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function addOption() {
    setOptions(prev => [...prev, { label: '', value: '', score: '' }]);
  }

  function removeOption(index: number) {
    setOptions(prev => prev.filter((_, i) => i !== index));
  }

  function updateOption(index: number, field: keyof OptionRow, value: string) {
    setOptions(prev =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o))
    );
  }

  function toggleDimension(dimId: number) {
    if (selectedIds.has(dimId)) {
      setDims(prev => prev.filter(d => d.dimensionId !== dimId));
    } else {
      setDims(prev => [...prev, { dimensionId: dimId, weight: '' }]);
    }
  }

  function updateDimWeight(dimId: number, weight: string) {
    setDims(prev =>
      prev.map(d => (d.dimensionId === dimId ? { ...d, weight } : d))
    );
  }

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <>
      <div onClick={onClose} className={styles.backdrop} />

      <form action={formAction} className={styles.wideCard}>
        {/* Header */}
        <div
          className={`px-6 bg-gradient-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 flex items-center justify-between ${styles.header}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">📋</span>
            <h2 className="text-base font-bold text-gray-800 leading-tight">
              {isEdit ? 'Edit' : 'New'} Question
            </h2>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="icon"
            size="sm"
            title="Close"
            aria-label="Close"
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </div>

        {/* Body */}
        <div
          className={`flex-1 overflow-y-auto px-6 py-5 space-y-5 ${styles.scrollArea}`}
        >
          {/* Global error */}
          {state.errors._form && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
              {state.errors._form}
            </div>
          )}

          {/* Question Type */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">
              Question Type <span className="text-magenta">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {QUESTION_TYPES.map(t => {
                const meta = QUESTION_TYPE_META[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQType(t)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      qType === t
                        ? 'border-magenta bg-magenta/5 text-magenta'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {/* Hidden input to carry type in FormData */}
            <input type="hidden" name="type" value={qType} />
            {state.errors.type && (
              <p className="text-xs text-red-500 mt-1">{state.errors.type}</p>
            )}
          </div>

          {/* Question Text */}
          <Input
            name="text"
            label="Question Text"
            placeholder="Enter your question…"
            defaultValue={initial?.text}
            error={state.errors.text}
            inputSize="sm"
            required
          />

          {/* Description */}
          <TextArea
            name="description"
            label="Description / Hint"
            placeholder="Optional helper text for respondents…"
            defaultValue={initial?.description}
            inputSize="sm"
            rows={2}
          />

          {/* Order index */}
          <Input
            name="order_index"
            label="Order Index"
            type="number"
            placeholder="e.g. 1"
            defaultValue={initial?.orderIndex ?? ''}
            inputSize="sm"
          />

          {/* Options – only for choice types */}
          {needsOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-600">
                  Options <span className="text-magenta">*</span>
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs font-semibold text-magenta hover:text-magenta/70 flex items-center gap-1"
                >
                  <span>+</span> Add option
                </button>
              </div>

              {state.errors.options && (
                <p className="text-xs text-red-500 mb-2">
                  {state.errors.options}
                </p>
              )}

              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      name="option_label"
                      value={opt.label}
                      onChange={e => updateOption(i, 'label', e.target.value)}
                      placeholder="Label"
                      className="flex-1 px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
                    />
                    <input
                      type="text"
                      name="option_value"
                      value={opt.value}
                      onChange={e => updateOption(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="w-20 px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
                    />
                    <input
                      type="number"
                      name="option_score"
                      value={opt.score}
                      onChange={e => updateOption(i, 'score', e.target.value)}
                      placeholder="Score"
                      className="w-16 px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                        title="Remove"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-gray-400 mt-2">
                Label = display text · Value = stored key · Score = optional
                weight
              </p>
            </div>
          )}

          {/* Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-600">
                Dimensions
              </label>
              <span className="text-[10px] text-gray-400">
                {dims.length} selected
              </span>
            </div>

            {state.errors.dimensions && (
              <p className="text-xs text-red-500 mb-2">
                {state.errors.dimensions}
              </p>
            )}

            {availableDimensions.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No dimensions available. Add dimension indexes first.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(dimsByCategory).map(([cat, catDims]) => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      {cat}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {catDims.map(dim => {
                        const isSelected = selectedIds.has(dim.id);
                        const row = dims.find(d => d.dimensionId === dim.id);
                        return (
                          <div
                            key={dim.id}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                              isSelected
                                ? 'bg-teal-50 border-teal-300'
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleDimension(dim.id)}
                              className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  viewBox="0 0 12 12"
                                  fill="currentColor"
                                  className="w-2.5 h-2.5"
                                >
                                  <path
                                    d="M10 3L5 8.5 2 5.5"
                                    stroke="white"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  isSelected ? 'text-teal-800' : 'text-gray-700'
                                }`}
                              >
                                {dim.indexName}
                              </p>
                              {dim.indexKey && (
                                <p className="text-[10px] font-mono text-gray-400">
                                  {dim.indexKey}
                                </p>
                              )}
                            </div>

                            {/* Weight input (only when selected) */}
                            {isSelected && (
                              <input
                                type="number"
                                placeholder="Wt."
                                value={row?.weight ?? ''}
                                onChange={e =>
                                  updateDimWeight(dim.id, e.target.value)
                                }
                                className="w-14 px-2 py-1 text-xs bg-white border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-300 font-semibold placeholder:font-normal placeholder-gray-400 text-right shrink-0"
                                min="0"
                                step="0.01"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden inputs to carry dim data in FormData */}
            {dims.map((d, i) => (
              <span key={i}>
                <input type="hidden" name="dim_id" value={d.dimensionId} />
                <input type="hidden" name="dim_weight" value={d.weight} />
              </span>
            ))}

            <p className="text-[10px] text-gray-400 mt-2">
              Click a dimension to attach it. Set a weight (比重) for scoring.
            </p>
          </div>

          {/* Scale config */}
          {isScale && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                Scale Range
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  name="option_label"
                  placeholder="Min label (e.g. 1)"
                  defaultValue={initial?.options?.[0]?.label ?? '1'}
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
                />
                <input
                  type="hidden"
                  name="option_value"
                  defaultValue={initial?.options?.[0]?.value ?? 'min'}
                />
                <input
                  type="hidden"
                  name="option_score"
                  defaultValue={initial?.options?.[0]?.score ?? ''}
                />
                <input
                  type="number"
                  name="option_label"
                  placeholder="Max label (e.g. 5)"
                  defaultValue={initial?.options?.[1]?.label ?? '5'}
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
                />
                <input
                  type="hidden"
                  name="option_value"
                  defaultValue={initial?.options?.[1]?.value ?? 'max'}
                />
                <input
                  type="hidden"
                  name="option_score"
                  defaultValue={initial?.options?.[1]?.score ?? ''}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Min and max labels for the scale.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 border-t border-gray-100 flex gap-3 ${styles.footer}`}
        >
          <Button
            type="button"
            variant="secondary"
            size="md"
            className={styles.btnCancel}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className={styles.btnCreate}
            disabled={isPending}
          >
            {isPending
              ? 'Saving…'
              : isEdit
                ? 'Save Changes'
                : 'Create Question'}
          </Button>
        </div>
      </form>
    </>,
    document.body
  );
}
