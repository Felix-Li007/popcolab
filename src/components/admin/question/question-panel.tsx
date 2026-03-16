'use client';

import { useEffect, useState, useActionState, useMemo } from 'react';
import { Button, Input, TextArea } from '@/ui';
import type {
  Question,
  QuestionFormState,
  QuestionType,
  DimensionIndex,
} from '@/types/question-type';
import { QUESTION_TYPE_META } from './question-card';

const EMPTY_STATE: QuestionFormState = { errors: {} };

type FormAction = (
  prevState: QuestionFormState,
  formData: FormData
) => Promise<QuestionFormState>;

type QuestionPanelProps = {
  action: FormAction;
  isEdit?: boolean;
  initial?: Question;
  availableDimensions: DimensionIndex[];
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
const DIMENSIONS_PAGE_SIZE = 9;

function defaultOptions(): OptionRow[] {
  return [
    { label: '', value: '', score: '' },
    { label: '', value: '', score: '' },
  ];
}

function toDimensionOptionRows(
  dimension: DimensionIndex | undefined
): OptionRow[] | null {
  if (!dimension || dimension.options.length === 0) {
    return null;
  }

  return dimension.options.map(option => ({
    label: option.label,
    value: option.value,
    score: '',
  }));
}

export default function QuestionPanel({
  action,
  isEdit = false,
  initial,
  availableDimensions,
  onSuccess,
  onDelete,
}: QuestionPanelProps) {
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
  const [selectedDimension, setSelectedDimension] = useState<DimRow | null>(
    initial?.dimensions?.[0]
      ? {
          dimensionId: initial.dimensions[0].dimensionId,
          weight:
            initial.dimensions[0].weight != null
              ? String(initial.dimensions[0].weight)
              : '',
        }
      : null
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
  const [dimensionSearch, setDimensionSearch] = useState('');
  const [dimensionCategoryFilter, setDimensionCategoryFilter] =
    useState<string>('all');
  const [dimensionPage, setDimensionPage] = useState(1);

  const selectedDimensionId = selectedDimension?.dimensionId ?? null;
  const dimensionCategories = useMemo(() => {
    return Array.from(
      new Set(availableDimensions.map(dimension => dimension.categoryName))
    );
  }, [availableDimensions]);
  const normalizedDimensionSearch = dimensionSearch.trim().toLowerCase();
  const filteredDimensions = useMemo(() => {
    return availableDimensions.filter(dimension => {
      const matchCategory =
        dimensionCategoryFilter === 'all' ||
        dimension.categoryName === dimensionCategoryFilter;
      if (!matchCategory) return false;

      if (!normalizedDimensionSearch) return true;
      return [
        dimension.indexName,
        dimension.indexKey ?? '',
        dimension.categoryName,
        String(dimension.id),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedDimensionSearch);
    });
  }, [availableDimensions, dimensionCategoryFilter, normalizedDimensionSearch]);
  const sortedDimensions = useMemo(() => {
    return [...filteredDimensions].sort((a, b) => {
      if (a.id === selectedDimensionId) return -1;
      if (b.id === selectedDimensionId) return 1;
      return 0;
    });
  }, [filteredDimensions, selectedDimensionId]);
  const dimensionTotalPages = Math.max(
    1,
    Math.ceil(sortedDimensions.length / DIMENSIONS_PAGE_SIZE)
  );
  const paginatedDimensions = useMemo(() => {
    return sortedDimensions.slice(
      (dimensionPage - 1) * DIMENSIONS_PAGE_SIZE,
      dimensionPage * DIMENSIONS_PAGE_SIZE
    );
  }, [sortedDimensions, dimensionPage]);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

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

  function syncOptionsFromDimension(
    dimensionId: number | null,
    nextType: QuestionType
  ) {
    if (
      dimensionId === null ||
      (nextType !== 'single_choice' && nextType !== 'multi_choice')
    ) {
      return;
    }

    const dimension = availableDimensions.find(item => item.id === dimensionId);
    const nextOptions = toDimensionOptionRows(dimension);
    if (!nextOptions) {
      return;
    }

    setOptions(nextOptions);
  }

  function toggleDimension(dimId: number) {
    setDimensionPage(1);
    if (selectedDimensionId === dimId) {
      setSelectedDimension(null);
    } else {
      setSelectedDimension({ dimensionId: dimId, weight: '' });
      syncOptionsFromDimension(dimId, qType);
    }
  }

  function updateDimWeight(dimId: number, weight: string) {
    setSelectedDimension(prev =>
      prev && prev.dimensionId === dimId ? { ...prev, weight } : prev
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
      <div className="flex-1 min-h-0 px-6 py-5 flex flex-col gap-5 overflow-hidden">
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
                  onClick={() => {
                    setQType(t);
                    syncOptionsFromDimension(selectedDimensionId, t);
                  }}
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
          label="Description"
          placeholder="Optional helper text for respondents…"
          defaultValue={initial?.description}
          inputSize="sm"
          rows={2}
        />

        {/* Dimensions */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-600 mb-2">
              DIMENSION <span className="text-magenta">*</span>
            </label>
            <span className="text-[10px] text-gray-400">
              {selectedDimension ? '1 selected' : 'None selected'}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mb-2">
            Select up to 1 dimension for this question.
          </p>
          <input
            type="text"
            value={dimensionSearch}
            onChange={e => {
              setDimensionSearch(e.target.value);
              setDimensionPage(1);
            }}
            placeholder="Search dimensions..."
            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-magenta/30 mb-2"
          />
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => {
                setDimensionCategoryFilter('all');
                setDimensionPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                dimensionCategoryFilter === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {dimensionCategories.map(categoryName => (
              <button
                key={categoryName}
                type="button"
                onClick={() => {
                  setDimensionCategoryFilter(categoryName);
                  setDimensionPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                  dimensionCategoryFilter === categoryName
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {categoryName}
              </button>
            ))}
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
          ) : filteredDimensions.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No dimensions match your search.
            </p>
          ) : (
            <div className="relative">
              {dimensionTotalPages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setDimensionPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={dimensionPage <= 1}
                    title="Previous dimension page"
                    className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDimensionPage(prev =>
                        Math.min(dimensionTotalPages, prev + 1)
                      )
                    }
                    disabled={dimensionPage >= dimensionTotalPages}
                    title="Next dimension page"
                    className="absolute right-0 top-1/2 z-10 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </>
              )}
              <div className="h-[230px] overflow-y-auto rounded-xl border border-gray-200 bg-white px-8 py-2">
                <div
                  className="grid gap-2 items-start"
                  style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                >
                  {paginatedDimensions.map(dim => {
                    const isSelected = selectedDimensionId === dim.id;
                    return (
                      <div
                        key={dim.id}
                        className={`min-w-0 rounded-xl border px-2.5 py-2 transition-colors ${
                          isSelected
                            ? 'border-teal-300 bg-teal-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleDimension(dim.id)}
                          className="flex w-full min-w-0 items-start gap-2 text-left"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                              isSelected
                                ? 'border-teal-500 bg-teal-500 text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected ? (
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
                            ) : null}
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p
                              className={`text-xs font-semibold leading-snug break-words ${
                                isSelected ? 'text-teal-800' : 'text-gray-700'
                              }`}
                            >
                              {dim.indexName}
                            </p>
                            <p className="truncate text-[10px] text-gray-400 leading-snug">
                              {dim.categoryName}
                              {dim.indexKey ? ` · ${dim.indexKey}` : ''}
                            </p>
                          </div>
                        </button>

                        {isSelected ? (
                          <input
                            type="number"
                            placeholder="Wt."
                            value={selectedDimension?.weight ?? ''}
                            onChange={e =>
                              updateDimWeight(dim.id, e.target.value)
                            }
                            className="mt-2 w-full rounded-lg border border-teal-200 bg-white px-2 py-1 text-right text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-300 placeholder:font-normal placeholder-gray-400"
                            min="0"
                            step="0.01"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Hidden inputs for dim data */}
          {selectedDimension && (
            <>
              <input
                type="hidden"
                name="dim_id"
                value={selectedDimension.dimensionId}
              />
              <input
                type="hidden"
                name="dim_weight"
                value={selectedDimension.weight}
              />
            </>
          )}
        </div>

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
            <input type="hidden" name="option_label" value={textPlaceholder} />
            <input type="hidden" name="option_value" value="placeholder" />
            <input type="hidden" name="option_score" value="" />
            <input type="hidden" name="option_label" value={String(maxChars)} />
            <input type="hidden" name="option_value" value="max_chars" />
            <input type="hidden" name="option_score" value="" />
          </>
        )}
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
