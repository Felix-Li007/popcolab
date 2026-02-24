'use client';

import { Badge, Button } from '@/ui';
import type { Question, QuestionType } from '@/types/question-type';

type Props = {
  question: Question;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, text: string) => void;
};

export const QUESTION_TYPE_META: Record<
  QuestionType,
  { label: string; icon: string; color: string }
> = {
  single_choice: {
    label: 'Single Choice',
    icon: '◉',
    color: 'bg-blue-100 text-blue-700',
  },
  multi_choice: {
    label: 'Multi Choice',
    icon: '☑',
    color: 'bg-purple-100 text-purple-700',
  },
  scale: {
    label: 'Scale Choice',
    icon: '〰',
    color: 'bg-orange-100 text-orange-700',
  },
  text_input: {
    label: 'Text Input',
    icon: '✏️',
    color: 'bg-green-100 text-green-700',
  },
};

export default function QuestionCard({
  question,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const meta = QUESTION_TYPE_META[question.type] ?? {
    label: question.type,
    icon: '?',
    color: 'bg-gray-100 text-gray-600',
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3 cursor-pointer group"
      onClick={() => question.id && onView(question.id)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none shrink-0">{meta.icon}</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}
          >
            {meta.label}
          </span>
          {question.orderIndex != null && (
            <span className="text-[10px] text-gray-400 shrink-0">
              #{question.orderIndex}
            </span>
          )}
        </div>

        {/* Action buttons – show on hover */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <Button
            variant="icon"
            size="xs"
            title="Edit"
            onClick={() => question.id && onEdit(question.id)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </Button>
          <Button
            variant="icon"
            size="xs"
            title="Delete"
            className="hover:text-red-500 hover:border-red-200"
            onClick={() => question.id && onDelete(question.id, question.text)}
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
          </Button>
        </div>
      </div>

      {/* Question text */}
      <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
        {question.text}
      </p>

      {/* Description */}
      {question.description && (
        <p className="text-xs text-gray-400 line-clamp-1">
          {question.description}
        </p>
      )}

      {/* Options preview */}
      {question.options.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {question.options.slice(0, 3).map((o, i) => (
            <Badge key={i} variant="default" size="xs">
              {o.label}
            </Badge>
          ))}
          {question.options.length > 3 && (
            <Badge variant="default" size="xs">
              +{question.options.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Dimensions preview */}
      {question.dimensions.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-50 mt-auto">
          {question.dimensions.slice(0, 3).map((d, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200"
            >
              <svg
                viewBox="0 0 12 12"
                fill="currentColor"
                className="w-2.5 h-2.5 shrink-0"
              >
                <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.3" />
                <circle cx="6" cy="6" r="2.5" fill="currentColor" />
              </svg>
              {d.dimensionName}
              {d.weight !== null && (
                <span className="text-teal-500 font-normal">×{d.weight}</span>
              )}
            </span>
          ))}
          {question.dimensions.length > 3 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-500">
              +{question.dimensions.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
