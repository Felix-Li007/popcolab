'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input, TextArea } from '@/ui';
import type {
  IntakeDimensionOption,
  IntakeForm,
  IntakeFormFormState,
  IntakeQuestionOption,
} from '@/types/intake-form-type';

const EMPTY_STATE: IntakeFormFormState = { errors: {} };
const DEFAULT_FORM_TYPE_OPTIONS = [
  'onboarding',
  'discovery',
  'pilot',
  'leadership',
  'remote',
  'sprint',
];

type FormAction = (
  prevState: IntakeFormFormState,
  formData: FormData
) => Promise<IntakeFormFormState>;

type IntakeFormPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: IntakeForm;
  availableQuestions: IntakeQuestionOption[];
  availableDimensions: IntakeDimensionOption[];
  onSuccess: () => void;
  onDelete?: () => void;
};

type IntakeEditTab = 'questions' | 'dimensions';

export default function IntakeFormPanel({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  availableQuestions,
  availableDimensions,
  onSuccess,
  onDelete,
}: IntakeFormPanelProps) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(
    initial?.questionIds ?? []
  );
  const [selectedDimensionIds, setSelectedDimensionIds] = useState<number[]>(
    initial?.dimensionIds ?? []
  );
  const [activeTab, setActiveTab] = useState<IntakeEditTab>('dimensions');
  const [questionSearch, setQuestionSearch] = useState('');
  const [dimensionSearch, setDimensionSearch] = useState('');
  const formTypeOptions = useMemo(() => {
    const options = [...DEFAULT_FORM_TYPE_OPTIONS];
    const current = initial?.formType?.trim();
    if (current && !options.includes(current)) options.push(current);
    return options;
  }, [initial?.formType]);

  const selectedSet = useMemo(
    () => new Set(selectedQuestionIds),
    [selectedQuestionIds]
  );
  const selectedDimensionSet = useMemo(
    () => new Set(selectedDimensionIds),
    [selectedDimensionIds]
  );
  const questionsById = useMemo(
    () => new Map(availableQuestions.map(question => [question.id, question])),
    [availableQuestions]
  );
  const dimensionsByCategory = useMemo(() => {
    return availableDimensions.reduce<Record<string, IntakeDimensionOption[]>>(
      (acc, dimension) => {
        const key = dimension.categoryName || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(dimension);
        return acc;
      },
      {}
    );
  }, [availableDimensions]);
  const normalizedQuestionSearch = questionSearch.trim().toLowerCase();
  const normalizedDimensionSearch = dimensionSearch.trim().toLowerCase();
  const questionsMatchedByDimension = useMemo(() => {
    if (selectedDimensionIds.length === 0) return availableQuestions;
    return availableQuestions.filter(question =>
      question.dimensionIds.some(dimensionId =>
        selectedDimensionSet.has(dimensionId)
      )
    );
  }, [availableQuestions, selectedDimensionIds.length, selectedDimensionSet]);
  const filteredQuestions = useMemo(() => {
    if (!normalizedQuestionSearch) return questionsMatchedByDimension;
    return questionsMatchedByDimension.filter(question => {
      const text = question.text.toLowerCase();
      const idText = String(question.id);
      return (
        text.includes(normalizedQuestionSearch) ||
        idText.includes(normalizedQuestionSearch)
      );
    });
  }, [questionsMatchedByDimension, normalizedQuestionSearch]);
  const filteredDimensionsByCategory = useMemo(() => {
    if (!normalizedDimensionSearch) return dimensionsByCategory;

    return availableDimensions.reduce<Record<string, IntakeDimensionOption[]>>(
      (acc, dimension) => {
        const category = (
          dimension.categoryName || 'Uncategorized'
        ).toLowerCase();
        const indexName = dimension.indexName.toLowerCase();
        const indexKey = (dimension.indexKey || '').toLowerCase();
        const idText = String(dimension.id);
        const matched =
          category.includes(normalizedDimensionSearch) ||
          indexName.includes(normalizedDimensionSearch) ||
          indexKey.includes(normalizedDimensionSearch) ||
          idText.includes(normalizedDimensionSearch);
        if (!matched) return acc;

        const key = dimension.categoryName || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(dimension);
        return acc;
      },
      {}
    );
  }, [availableDimensions, dimensionsByCategory, normalizedDimensionSearch]);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  function toggleQuestion(questionId: number) {
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      }
      return [...prev, questionId];
    });
  }

  function toggleDimension(dimensionId: number) {
    setSelectedDimensionIds(prev => {
      const nextDimensionIds = prev.includes(dimensionId)
        ? prev.filter(id => id !== dimensionId)
        : [...prev, dimensionId];

      setSelectedQuestionIds(prevQuestionIds => {
        if (nextDimensionIds.length === 0) return prevQuestionIds;
        const nextDimensionSet = new Set(nextDimensionIds);
        return prevQuestionIds.filter(questionId => {
          const question = questionsById.get(questionId);
          if (!question) return false;
          return question.dimensionIds.some(selectedId =>
            nextDimensionSet.has(selectedId)
          );
        });
      });

      return nextDimensionIds;
    });
  }

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Intake Form' : 'New Form'}
      subtitle={isEdit && initial?.id ? `#${initial.id}` : undefined}
      rootTestId="intake-edit-modal-root"
      panelTestId="intake-edit-modal"
      panelClassName="!max-w-3xl min-h-[34rem]"
      bodyTestId="intake-edit-modal-body"
      bodyClassName="p-0 overflow-hidden max-h-[75vh] flex flex-col min-h-0"
    >
      <form
        action={formAction}
        className="flex flex-col h-full min-h-0"
        data-testid="intake-edit-form"
      >
        <div className="flex-1 overflow-y-auto space-y-3.5">
          {state.errors._form && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
              {state.errors._form}
            </div>
          )}

          <Input
            name="name"
            label="Form Name"
            placeholder="e.g. Employee Onboarding Intake"
            defaultValue={initial?.name}
            error={state.errors.name}
            inputSize="sm"
            required
          />

          <TextArea
            name="description"
            label="Description"
            placeholder="What information this intake form should collect..."
            defaultValue={initial?.description}
            error={state.errors.description}
            rows={4}
            inputSize="sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                Form Type <span className="text-magenta">*</span>
              </label>
              <div className="relative">
                <select
                  name="formType"
                  defaultValue={initial?.formType ?? ''}
                  className="w-full text-xs font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 px-3 py-2 outline-none focus:ring-2 focus:ring-magenta/30 appearance-none cursor-pointer"
                  required
                  data-testid="intake-edit-form-type"
                >
                  <option value="" disabled>
                    Select form type
                  </option>
                  {formTypeOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
              {state.errors.formType && (
                <p className="text-[10px] text-red-500 mt-1">
                  {state.errors.formType}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                Status <span className="text-magenta">*</span>
              </label>
              <div className="relative">
                <select
                  name="status"
                  defaultValue={String(initial?.status ?? 0)}
                  className="w-full text-xs font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 px-3 py-2 outline-none focus:ring-2 focus:ring-magenta/30 appearance-none cursor-pointer"
                  data-testid="intake-edit-status"
                >
                  <option value="0">Draft (0)</option>
                  <option value="1">Active (1)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
              {state.errors.status && (
                <p className="text-[10px] text-red-500 mt-1">
                  {state.errors.status}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('dimensions')}
              data-testid="intake-edit-tab-dimensions"
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'dimensions'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dimensions ({selectedDimensionIds.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              data-testid="intake-edit-tab-questions"
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'questions'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Questions ({selectedQuestionIds.length})
            </button>
          </div>

          {activeTab === 'dimensions' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-600">
                  Dimensions
                </label>
                <span className="text-[10px] text-gray-400">
                  {selectedDimensionIds.length} selected
                </span>
              </div>
              <input
                type="text"
                value={dimensionSearch}
                onChange={event => setDimensionSearch(event.target.value)}
                placeholder="Search dimensions..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-teal-200 mb-2"
                data-testid="intake-edit-dimension-search"
              />

              {availableDimensions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No dimensions available.
                </p>
              ) : Object.keys(filteredDimensionsByCategory).length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No dimensions match your search.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 p-2 space-y-2 bg-white">
                  {Object.entries(filteredDimensionsByCategory).map(
                    ([categoryName, dimensions]) => (
                      <div key={categoryName}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1 mb-1">
                          {categoryName}
                        </p>
                        <div className="space-y-1">
                          {dimensions.map(dimension => {
                            const isSelected = selectedDimensionSet.has(
                              dimension.id
                            );
                            return (
                              <button
                                key={dimension.id}
                                type="button"
                                onClick={() => toggleDimension(dimension.id)}
                                className={`w-full text-left px-3 py-2.5 flex items-start gap-2 rounded-lg transition-colors ${
                                  isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'
                                }`}
                                data-testid="intake-edit-dimension-option"
                              >
                                <span
                                  className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isSelected
                                      ? 'bg-teal-500 border-teal-500 text-white'
                                      : 'border-gray-300 text-transparent'
                                  }`}
                                >
                                  ✓
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-mono text-gray-400">
                                    {dimension.indexKey
                                      ? `${dimension.indexKey} · #${dimension.id}`
                                      : `#${dimension.id}`}
                                  </p>
                                  <p className="text-xs text-gray-700 line-clamp-2">
                                    {dimension.indexName}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-600">
                  Questions <span className="text-magenta">*</span>
                </label>
                <span className="text-[10px] text-gray-400">
                  {selectedQuestionIds.length} selected
                </span>
              </div>
              <input
                type="text"
                value={questionSearch}
                onChange={event => setQuestionSearch(event.target.value)}
                placeholder="Search questions..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-teal-200 mb-2"
                data-testid="intake-edit-question-search"
              />

              {state.errors.questions && (
                <p className="text-[10px] text-red-500 mb-2">
                  {state.errors.questions}
                </p>
              )}

              {availableQuestions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No questions available.
                </p>
              ) : selectedDimensionIds.length > 0 &&
                questionsMatchedByDimension.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No questions match selected dimensions.
                </p>
              ) : filteredQuestions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No questions match your search.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white">
                  {filteredQuestions.map(question => {
                    const isSelected = selectedSet.has(question.id);
                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => toggleQuestion(question.id)}
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors ${
                          isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'
                        }`}
                        data-testid="intake-edit-question-option"
                      >
                        <span
                          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-teal-500 border-teal-500 text-white'
                              : 'border-gray-300 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-gray-400">
                            #{question.id}
                          </p>
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {question.text}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedQuestionIds.map(questionId => (
            <input
              key={questionId}
              type="hidden"
              name="questionId"
              value={questionId}
            />
          ))}
          {selectedDimensionIds.map(dimensionId => (
            <input
              key={dimensionId}
              type="hidden"
              name="dimensionId"
              value={dimensionId}
            />
          ))}
        </div>

        <div className="sticky bottom-0 z-10 px-3 py-2 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
          {isEdit && onDelete ? (
            <Button
              type="button"
              onClick={onDelete}
              variant="secondary"
              size="md"
              className="!text-red-500 !border-red-200 hover:!text-red-700 hover:!bg-red-50"
              disabled={isPending}
              icon={
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
              }
            >
              Delete
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Form'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
