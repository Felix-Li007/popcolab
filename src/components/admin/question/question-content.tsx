'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuestionPanel from '@/components/admin/question/question-panel';
import type { Question, DimensionIndex } from '@/types/question-type';
import {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
} from '@/actions/question-actions';
import { Button, Badge } from '@/ui';
import PaginationBar from '@/components/shared/pagination-bar';
import { QUESTION_TYPE_META } from '@/components/admin/question/question-card';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import styles from '@/styles/question-content.module.css';

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

export default function QuestionContent({
  initialData,
  availableDimensions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const [questions, setQuestions] = useState<Question[]>(initialData);
  const [filter, setFilter] = useState<TypeFilter>('All');
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
  }, [filter, search]);

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
        const matchSearch =
          !normalizedSearch ||
          q.text.toLowerCase().includes(normalizedSearch) ||
          (q.description ?? '').toLowerCase().includes(normalizedSearch);
        return matchType && matchSearch;
      });
  }, [questions, filter, search]);

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

  function handleSuccess() {
    router.refresh();
    setIsCreating(false);
  }

  function handleDelete(id: number, text: string) {
    if (
      !window.confirm(
        `Delete this question?\n\n"${text}"\n\nThis cannot be undone.`
      )
    )
      return;
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
    selectedId !== null
      ? updateQuestionAction.bind(null, selectedId)
      : createQuestionAction;

  return (
    <>
      <div className="flex flex-col">
        <div className="flex flex-1 min-h-0 px-4 py-3 gap-4">
          <div
            className={`${styles.listPanel} border border-gray-200 flex flex-col bg-white z-10 shadow-[2px_0_12px_rgba(0,0,0,0.07)] rounded-2xl overflow-hidden`}
          >
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-700">
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
                >
                  Add
                </Button>
              </div>
              <div className="relative">
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
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder-gray-400 transition"
                />
              </div>
            </div>

            <div className="px-3 py-2 border-b border-gray-100 flex gap-1 shrink-0">
              {TYPE_FILTERS.map(f => (
                <Button
                  key={f}
                  onClick={() => setFilter(f)}
                  variant="tab"
                  size="xs"
                  isActive={filter === f}
                  className="whitespace-nowrap !h-7 !min-w-0 !px-2 !py-0 !text-[11px]"
                >
                  {f === 'All'
                    ? 'All'
                    : f === 'single_choice'
                      ? 'Single'
                      : f === 'multi_choice'
                        ? 'Multi'
                        : f === 'scale'
                          ? 'Scale'
                          : 'Text'}
                  <Badge
                    variant="default"
                    size="xs"
                    bgColor={filter === f ? 'bg-white/20' : 'bg-gray-100'}
                    textColor={filter === f ? 'text-white' : 'text-gray-500'}
                  >
                    {counts[f]}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                  <span className="text-3xl">📋</span>
                  <p
                    className="text-xs text-gray-500"
                    data-testid="survey-empty"
                  >
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
                          className={`w-full text-left px-4 py-3 flex items-start gap-2.5 transition-all border-l-4 ${
                            isSelected
                              ? 'border-magenta bg-magenta/[.06]'
                              : 'border-transparent hover:bg-magenta/[.03]'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0 mt-0.5 text-right">
                            {globalIdx}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1 ${meta.color}`}
                            >
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
                            {q.dimensions.length > 0 && (
                              <p className="text-xs text-teal-600 mt-0.5">
                                {q.dimensions.length} dimension
                                {q.dimensions.length > 1 ? 's' : ''}
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

          <div
            className={`${styles.editPanel} bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm`}
          >
            {showPanel ? (
              <QuestionPanel
                key={isCreating ? 'new' : String(selectedId)}
                action={panelAction}
                isEdit={!isCreating && selectedId !== null}
                initial={isCreating ? undefined : selectedQuestion}
                availableDimensions={availableDimensions}
                onSuccess={handleSuccess}
                onDelete={
                  !isCreating && selectedId !== null && selectedQuestion
                    ? () => handleDelete(selectedId!, selectedQuestion!.text)
                    : undefined
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
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
    </>
  );
}
