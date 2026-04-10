'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuestionPanel from '@/components/admin/question/question-panel';
import type { Question, DimensionIndex, FormName } from '@/types/question-type';
import {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
} from '@/actions/question-actions';
import { Button, Badge } from '@/ui';
import PaginationBar from '@/components/shared/pagination-bar';
import { QUESTION_TYPE_META } from '@/components/admin/question/question-card';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import styles from '@/styles/admin/questions/question-content.module.css';

type Props = {
  initialData: Question[];
  availableDimensions: DimensionIndex[];
};

const TYPE_FILTERS = [
  'All',
  'single_choice',
  'multi_choice',
  'scale',
  'text_input',
] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];
const FORM_FILTERS: FormName[] = ['REQUEST', 'MEMBER', 'ASSESS', 'EXPERIENCE'];
const INTAKE_FORM_LABELS: Record<FormName, string> = {
  REQUEST: 'LEADER',
  MEMBER: 'MEMBER',
  ASSESS: 'ASSESS',
  EXPERIENCE: 'EXPERIENCE',
};

function getTypeFilterLabel(filter: TypeFilter) {
  if (filter === 'All') {
    return 'All';
  }

  if (filter === 'single_choice') {
    return 'Single';
  }

  if (filter === 'multi_choice') {
    return 'Multi';
  }

  if (filter === 'scale') {
    return 'Scale';
  }

  return 'Text';
}

export default function QuestionContent({
  initialData,
  availableDimensions,
}: Readonly<Props>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const [questions, setQuestions] = useState<Question[]>(initialData);
  const [filter, setFilter] = useState<TypeFilter>('All');
  const [selectedForms, setSelectedForms] = useState<FormName[]>(FORM_FILTERS);
  const [search, setSearch] = useState('');
  const idParam = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQuestions(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!idParam || !/^\d+$/.test(idParam)) {
      setSelectedId(null);
      return;
    }
    setSelectedId(Number(idParam));
  }, [idParam]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filter, selectedForms, search]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...questions]
      .sort((a, b) => {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (aUpdated !== bUpdated) return bUpdated - aUpdated;
        return (b.id ?? 0) - (a.id ?? 0);
      })
      .filter(q => {
        const matchType = filter === 'All' || q.type === filter;
        const matchForm =
          selectedForms.length === 0 || selectedForms.includes(q.formName);
        const matchSearch =
          !normalizedSearch ||
          q.text.toLowerCase().includes(normalizedSearch) ||
          (q.description ?? '').toLowerCase().includes(normalizedSearch);
        return matchType && matchForm && matchSearch;
      });
  }, [questions, filter, selectedForms, search]);

  const counts: Record<TypeFilter, number> = {
    All: questions.length,
    single_choice: questions.filter(q => q.type === 'single_choice').length,
    multi_choice: questions.filter(q => q.type === 'multi_choice').length,
    scale: questions.filter(q => q.type === 'scale').length,
    text_input: questions.filter(q => q.type === 'text_input').length,
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / DEFAULT_PAGE_SIZE)
  );
  const paginated = filtered.slice(
    (page - 1) * DEFAULT_PAGE_SIZE,
    page * DEFAULT_PAGE_SIZE
  );

  const selectedQuestion = questions.find(q => q.id === selectedId);
  const showPanel = isCreating || selectedId !== null;
  let deleteSelectedQuestion: (() => void) | undefined;

  if (!isCreating && selectedId !== null && selectedQuestion !== undefined) {
    deleteSelectedQuestion = () =>
      handleDelete(selectedId, selectedQuestion.text);
  }

  function toggleFormFilter(formName: FormName) {
    setSelectedForms(prev =>
      prev.includes(formName)
        ? prev.filter(item => item !== formName)
        : [...prev, formName]
    );
  }

  function handleSuccess() {
    router.refresh();
    setIsCreating(false);
  }

  function handleDelete(id: number, text: string) {
    const shouldDelete = globalThis.confirm(
      `Delete this question?\n\n"${text}"\n\nThis cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteQuestionAction(id);
        setSelectedId(null);
        setIsCreating(false);
        router.refresh();
      } catch {
        alert('Failed to delete question. Please try again.');
      }
    });
  }

  const panelAction =
    selectedId === null
      ? createQuestionAction
      : updateQuestionAction.bind(null, selectedId);

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageGrid}>
        <div
          className={`${styles.listPanel} z-10 flex flex-col overflow-hidden`}
        >
          <div className={styles.listHeader}>
            <div className={styles.headerRow}>
              <span className={styles.headerTitle}>
                Questions ({filtered.length})
              </span>
              <Button
                onClick={() => {
                  setSelectedId(null);
                  setIsCreating(true);
                }}
                variant="primary"
                size="sm"
                icon={<span>+</span>}
                className="!h-9 !min-w-0 !px-4 border border-white/20 bg-[linear-gradient(135deg,#ff4fa6_0%,#ef476f_55%,#ff7e5f_100%)] shadow-[0_16px_28px_rgba(239,71,111,0.24),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                Add
              </Button>
            </div>
            <div className={styles.searchShell}>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                data-testid="survey-search"
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.filterWrap}>
            <div className={styles.filterCard}>
              <div className={styles.typePills}>
                {TYPE_FILTERS.map(f => (
                  <Button
                    key={f}
                    onClick={() => setFilter(f)}
                    variant="tab"
                    size="xs"
                    isActive={filter === f}
                    className={styles.typePill}
                  >
                    {getTypeFilterLabel(f)}
                    <Badge
                      variant="default"
                      size="xs"
                      className={styles.typeCount}
                      bgColor={filter === f ? 'bg-white/20' : 'bg-gray-100'}
                      textColor={filter === f ? 'text-white' : 'text-gray-500'}
                    >
                      {counts[f]}
                    </Badge>
                  </Button>
                ))}
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Form</span>
                <div className={styles.formPills}>
                  {FORM_FILTERS.map(formName => {
                    const checked = selectedForms.includes(formName);
                    return (
                      <label
                        key={formName}
                        className={`${styles.formPill} ${
                          checked
                            ? 'border-teal-200 bg-white/90 text-teal-800 shadow-[0_8px_18px_rgba(45,212,191,0.16),inset_0_1px_0_rgba(255,255,255,0.84)]'
                            : 'border-transparent text-gray-500 hover:border-gray-200 hover:bg-white/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFormFilter(formName)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-teal-700 focus:ring-teal-300"
                        />
                        <span>{INTAKE_FORM_LABELS[formName]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.listArea}>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="text-3xl">📋</span>
                <p className="text-xs text-gray-500" data-testid="survey-empty">
                  {search ? 'No matches found.' : 'No questions yet.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {paginated.map((q, idx) => {
                  const meta = QUESTION_TYPE_META[q.type];
                  const isSelected = q.id === selectedId && !isCreating;
                  const globalIdx = (page - 1) * DEFAULT_PAGE_SIZE + idx + 1;
                  return (
                    <li key={q.id} className={styles.questionItem}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(q.id ?? null);
                          setIsCreating(false);
                        }}
                        className={`${styles.rowButton} ${
                          isSelected
                            ? styles.rowButtonActive
                            : styles.rowButtonIdle
                        }`}
                      >
                        <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0 mt-0.5 text-right">
                          {globalIdx}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={`${styles.typeBadge} ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                          <p
                            className={`text-xs leading-snug line-clamp-2 ${
                              isSelected
                                ? 'text-gray-900 font-semibold'
                                : 'text-gray-700'
                            }`}
                          >
                            {q.text}
                          </p>
                          {q.dimensions[0] && (
                            <p className="text-xs text-teal-600 mt-0.5">
                              {q.dimensions[0].dimensionName}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        <div className={`${styles.editPanel} overflow-hidden`}>
          {showPanel ? (
            <QuestionPanel
              key={isCreating ? 'new' : String(selectedId)}
              action={panelAction}
              isEdit={!isCreating && selectedId !== null}
              initial={isCreating ? undefined : selectedQuestion}
              availableDimensions={availableDimensions}
              onSuccess={handleSuccess}
              onDelete={deleteSelectedQuestion}
            />
          ) : (
            <div className={styles.panelEmptyState}>
              <span className="text-5xl">📋</span>
              <p className="text-sm font-semibold text-gray-600">
                Select a question to edit
              </p>
              <p className="text-xs text-gray-400">
                or click <strong>+ Add</strong> to create a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
