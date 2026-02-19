'use client';

import { useEffect, useState, useActionState } from 'react';
import { Button, Input, TextArea } from '@/components/ui';
import type {
  QuestionData,
  QuestionFormState,
  QuestionType,
  DimensionIndexData,
} from '@/types/question';
import { QUESTION_TYPE_META } from './QuestionCard';

const EMPTY_STATE: QuestionFormState = { errors: {} };

type FormAction = (
  prevState: QuestionFormState,
  formData: FormData
) => Promise<QuestionFormState>;

type Props = {
  action: FormAction;
  isEdit?: boolean;
  initial?: QuestionData;
  availableDimensions: DimensionIndexData[];
  onSuccess: () => void;
  onDelete?: () => void;
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

export default function QuestionEditPanel({
  action,
  isEdit = false,
  initial,
  availableDimensions,
  onSuccess,
  onDelete,
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
  const isText = qType === 'text_input';

  const [textPlaceholder, setTextPlaceholder] = useState(
    initial?.type === 'text_input' ? (initial?.options?.[0]?.label ?? '') : ''
  );
  const [maxChars, setMaxChars] = useState(
    initial?.type === 'text_input'
      ? Number(initial?.options?.[1]?.label ?? 250)
      : 250
  );

  // Group available dimensions by category
  const dimsByCategory = availableDimensions.reduce<
    Record<string, DimensionIndexData[]>
  >((acc, d) => {
    const key = d.categoryName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const selectedIds = new Set(dims.map(d => d.dimensionId));

  // Notify parent on success
  useEffect(() => {
    if (state.success) onSuccess();
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

  return (
    <form action={formAction} className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{isEdit ? '✏️' : '📋'}</span>
          <h3 className="text-sm font-bold text-gray-800">
            {isEdit ? 'Edit Question' : 'New Question'}
          </h3>
          {isEdit && initial?.id && (
            <span className="text-xs text-gray-400 font-mono">
              #{initial.id}
            </span>
          )}
        </div>
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Delete
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Global error */}
        {state.errors._form && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
            {state.errors._form}
          </div>
        )}

        {/* Question Type */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">
            QUESTION TYPE <span className="text-magenta">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map(t => {
              const meta = QUESTION_TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQType(t)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex-1 min-w-[120px] ${
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
            <div className="mb-2">
              <label className="text-xs font-bold text-gray-600">
                ANSWER OPTIONS <span className="text-magenta">*</span>
              </label>
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
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-xs font-semibold text-magenta hover:text-magenta/70 flex items-center gap-1"
            >
              <span>+</span> Add option
            </button>
          </div>
        )}

        {/* Scale config */}
        {isScale && (
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">
              Scale Range
            </label>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Min
                </span>
                <input
                  type="number"
                  name="option_label"
                  placeholder="e.g. 1"
                  defaultValue={initial?.options?.[0]?.label ?? '1'}
                  className="w-full px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
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
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Max
                </span>
                <input
                  type="number"
                  name="option_label"
                  placeholder="e.g. 5"
                  defaultValue={initial?.options?.[1]?.label ?? '5'}
                  className="w-full px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
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
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Step
                </span>
                <input
                  type="number"
                  name="option_label"
                  placeholder="e.g. 1"
                  defaultValue={initial?.options?.[2]?.label ?? '1'}
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white font-semibold placeholder:font-normal placeholder-gray-400"
                />
                <input
                  type="hidden"
                  name="option_value"
                  defaultValue={initial?.options?.[2]?.value ?? 'step'}
                />
                <input
                  type="hidden"
                  name="option_score"
                  defaultValue={initial?.options?.[2]?.score ?? ''}
                />
              </div>
            </div>
          </div>
        )}

        {/* Text Input Settings */}
        {isText && (
          <>
            <label className="block text-xs font-bold text-gray-600 mb-2">
              INPUT SETTINGS <span className="text-magenta">*</span>
            </label>
            <div>
              <span className="text-[10px] text-gray-400 font-semibold">
                Placeholder
              </span>
              <textarea
                rows={2}
                value={textPlaceholder}
                onChange={e => setTextPlaceholder(e.target.value)}
                placeholder="Type your answer here…"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 resize-none font-semibold placeholder:font-normal placeholder-gray-400"
              />
            </div>
            {/* Max character limit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Max Character
                </span>
                <span className="text-xs font-bold text-magenta">
                  {maxChars} chars
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={maxChars}
                title="Max character limit"
                onChange={e => setMaxChars(Number(e.target.value))}
                className="w-full cursor-pointer accent-magenta"
              />
            </div>
            {/* Hidden inputs to carry text_input settings as options */}
            <input type="hidden" name="option_label" value={textPlaceholder} />
            <input type="hidden" name="option_value" value="placeholder" />
            <input type="hidden" name="option_score" value="" />
            <input type="hidden" name="option_label" value={String(maxChars)} />
            <input type="hidden" name="option_value" value="max_chars" />
            <input type="hidden" name="option_score" value="" />
          </>
        )}

        {/* Dimensions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-600 mb-2">
              DEIMENSIONS <span className="text-magenta">*</span>
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
              No dimensions available.
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

          {/* Hidden inputs for dim data */}
          {dims.map((d, i) => (
            <span key={i}>
              <input type="hidden" name="dim_id" value={d.dimensionId} />
              <input type="hidden" name="dim_weight" value={d.weight} />
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}
