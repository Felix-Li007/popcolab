'use client';

import type { Question } from '@/types/question-type';
import type { UserAnswer } from '@/types/response-type';

type Props = {
  question: Question;
  answer: UserAnswer | undefined;
  onAnswerAction: (answer: UserAnswer) => void;
};

export default function QuestionStep({
  question,
  answer,
  onAnswerAction,
}: Readonly<Props>) {
  const qId = question.id!;

  // ── Scale ──────────────────────────────────────────────────────────────────
  if (question.type === 'scale') {
    return (
      <div className="flex flex-col gap-4">
        <QuestionHeader question={question} />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() =>
                onAnswerAction({
                  questionId: qId,
                  questionType: 'scale',
                  selectedOptionIds: [],
                  scaleValue: n,
                })
              }
              className={`w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                answer?.scaleValue === n
                  ? 'border-teal-deep bg-teal-deep text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-teal-deep hover:text-teal-deep'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>
      </div>
    );
  }

  // ── Single Choice ──────────────────────────────────────────────────────────
  if (question.type === 'single_choice') {
    const selectedId = answer?.selectedOptionIds[0] ?? null;
    return (
      <div className="flex flex-col gap-4">
        <QuestionHeader question={question} />
        <div className="flex flex-col gap-2">
          {question.options.map(opt => (
            <button
              key={opt.id}
              onClick={() =>
                onAnswerAction({
                  questionId: qId,
                  questionType: 'single_choice',
                  selectedOptionIds: [opt.id!],
                  scaleValue: null,
                })
              }
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-left transition-all ${
                selectedId === opt.id
                  ? 'border-teal-deep bg-teal-deep/5 text-teal-deep font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Multi Choice ───────────────────────────────────────────────────────────
  if (question.type === 'multi_choice') {
    const selectedIds = answer?.selectedOptionIds ?? [];
    return (
      <div className="flex flex-col gap-4">
        <QuestionHeader question={question} />
        <p className="text-xs text-gray-400">Select all that apply</p>
        <div className="flex flex-col gap-2">
          {question.options.map(opt => {
            const isSelected = selectedIds.includes(opt.id!);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  const next = isSelected
                    ? selectedIds.filter(id => id !== opt.id)
                    : [...selectedIds, opt.id!];
                  onAnswerAction({
                    questionId: qId,
                    questionType: 'multi_choice',
                    selectedOptionIds: next,
                    scaleValue: null,
                  });
                }}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-left transition-all ${
                  isSelected
                    ? 'border-teal-deep bg-teal-deep/5 text-teal-deep font-medium'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Text Input (reflection — not scored) ───────────────────────────────────
  const text = answer?.textValue ?? '';
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const isOver = wordCount > 100;

  return (
    <div className="flex flex-col gap-4">
      <QuestionHeader question={question} />
      <p className="text-xs text-gray-400 italic">
        This is a reflection question and does not affect your result.
      </p>
      <textarea
        value={text}
        onChange={e =>
          onAnswerAction({
            questionId: qId,
            questionType: 'text_input',
            selectedOptionIds: [],
            scaleValue: null,
            textValue: e.target.value,
          })
        }
        placeholder="Write your reflection here…"
        rows={5}
        className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-gray-700 resize-none transition-colors focus:outline-none ${
          isOver
            ? 'border-red-400 focus:border-red-400'
            : 'border-gray-200 focus:border-teal-deep'
        }`}
      />
      <p
        className={`text-xs text-right ${isOver ? 'text-red-500' : 'text-gray-400'}`}
      >
        {wordCount} / 100 words{isOver ? ' — please shorten your response' : ''}
      </p>
    </div>
  );
}

function QuestionHeader({ question }: Readonly<{ question: Question }>) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-bold text-gray-800">{question.text}</h2>
      {question.description && (
        <p className="text-sm text-gray-500">{question.description}</p>
      )}
    </div>
  );
}
