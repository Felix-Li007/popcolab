'use client';

import { createPortal } from 'react-dom';
import { Button, Badge } from '@/ui';
import type { QuestionData } from '@/types/question';
import { QUESTION_TYPE_META } from './question-card';
import styles from '@/styles/personality-form-modal.module.css';

type Props = {
  isOpen: boolean;
  question: QuestionData | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, text: string) => void;
};

export default function QuestionView({
  isOpen,
  question,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  if (!isOpen || !question || typeof window === 'undefined') return null;

  const meta = QUESTION_TYPE_META[question.type] ?? {
    label: question.type,
    icon: '?',
    color: 'bg-gray-100 text-gray-600',
  };

  const createdAt = question.createdAt
    ? new Date(question.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const updatedAt = question.updatedAt
    ? new Date(question.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return createPortal(
    <>
      <div onClick={onClose} className={styles.backdrop} />

      <div className={styles.card}>
        {/* Header */}
        <div
          className={`px-6 bg-gradient-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 flex items-center justify-between ${styles.header}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">🔍</span>
            <h2 className="text-base font-bold text-gray-800 leading-tight">
              Question Detail
            </h2>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="icon"
            size="sm"
            title="Close"
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
          {/* Type + ID row */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.color}`}
            >
              {meta.icon} {meta.label}
            </span>
            <span className="text-xs text-gray-400">ID #{question.id}</span>
            {question.orderIndex != null && (
              <span className="text-xs text-gray-400">
                · Order {question.orderIndex}
              </span>
            )}
          </div>

          {/* Question text */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Question
            </p>
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              {question.text}
            </p>
          </div>

          {/* Description */}
          {question.description && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-gray-600">{question.description}</p>
            </div>
          )}

          {/* Options */}
          {question.options.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                {question.type === 'scale' ? 'Scale Range' : 'Options'} (
                {question.options.length})
              </p>
              <div className="space-y-1.5">
                {question.options.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">
                        {i + 1}.
                      </span>
                      <span className="text-xs font-semibold text-gray-800 truncate">
                        {opt.label}
                      </span>
                      <Badge variant="default" size="xs" className="shrink-0">
                        {opt.value}
                      </Badge>
                    </div>
                    {opt.score != null && (
                      <span className="text-[10px] font-bold text-magenta shrink-0 ml-2">
                        score {opt.score}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dimensions */}
          {question.dimensions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Dimensions ({question.dimensions.length})
              </p>
              <div className="space-y-1.5">
                {question.dimensions.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="w-3.5 h-3.5 text-teal-600 shrink-0"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="7"
                          fill="currentColor"
                          opacity="0.2"
                        />
                        <circle cx="8" cy="8" r="3.5" fill="currentColor" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-teal-800 truncate">
                          {d.dimensionName}
                        </p>
                        <p className="text-[10px] text-teal-500">
                          {d.categoryName}
                        </p>
                      </div>
                      {d.indexKey && (
                        <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-lg shrink-0">
                          {d.indexKey}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {d.weight !== null ? (
                        <div className="text-right">
                          <p className="text-[10px] text-teal-500 font-semibold leading-none">
                            Weight
                          </p>
                          <p className="text-sm font-bold text-teal-700 leading-tight">
                            {d.weight}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          no weight
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                Created
              </p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                {createdAt}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                Last Updated
              </p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                {updatedAt}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 border-t border-gray-100 flex gap-3 ${styles.footer}`}
        >
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => {
              onDelete(question.id!, question.text);
            }}
          >
            <span className="text-red-500">Delete</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="flex-[2]"
            onClick={() => question.id && onEdit(question.id)}
          >
            Edit Question
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}
