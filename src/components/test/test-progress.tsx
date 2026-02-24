'use client';

import type { Question, QuestionType } from '@/types/question-type';

type Props = {
  current: number;
  total: number;
  questions: Question[];
};

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Choice',
  multi_choice: 'Multi-Select',
  scale: 'Scale',
  text_input: 'Reflection',
};

const MILESTONE_MESSAGES = [
  null,
  'Great job!',
  'Halfway through!',
  'Almost there!',
  'One more to go!',
];

const NODE_COUNT = 5;

// Pick the question at each milestone position and return its readable type label
function getLabelForNode(nodeIndex: number, questions: Question[]): string {
  const qIndex = Math.round(
    (nodeIndex / (NODE_COUNT - 1)) * (questions.length - 1)
  );
  const q = questions[Math.min(qIndex, questions.length - 1)];
  return q ? TYPE_LABELS[q.type] : '';
}

export default function TestProgress({ current, total, questions }: Props) {
  const progress = total <= 1 ? 1 : (current - 1) / (total - 1);

  const activeNodeIndex = Array.from({ length: NODE_COUNT }).reduce<number>(
    (last: number, _: unknown, i: number) => {
      const threshold = i / (NODE_COUNT - 1);
      return progress >= threshold - 0.001 ? i : last;
    },
    0
  );

  const currentMessage = MILESTONE_MESSAGES[activeNodeIndex];
  const lineFill = Math.min(100, (activeNodeIndex / (NODE_COUNT - 1)) * 100);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Title + counter */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          Play Personality Assessment
        </p>
        <span className="text-xs text-gray-400">
          {current} / {total}
        </span>
      </div>

      {/* Milestone message - fixed height so layout never shifts */}
      <div className="h-5 flex items-center">
        {currentMessage && activeNodeIndex > 0 && (
          <span className="text-xs font-semibold text-teal-deep bg-gray-100 px-3 py-0.5 rounded-full">
            {currentMessage}
          </span>
        )}
      </div>

      {/* Stepped progress */}
      <div className="relative flex items-start justify-between">
        {/* Track background */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 z-0" />

        {/* Track fill */}
        <div
          className="absolute left-0 top-4 h-0.5 bg-teal-deep z-0 transition-all duration-500"
          style={{ width: `${lineFill}%` }}
        />

        {/* Nodes */}
        {Array.from({ length: NODE_COUNT }).map((_, i) => {
          const isCompleted = i < activeNodeIndex;
          const isCurrent = i === activeNodeIndex;

          return (
            <div
              key={i}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-teal-deep text-white'
                    : isCurrent
                      ? 'bg-teal-deep text-white ring-4 ring-teal-deep/20'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap transition-colors duration-300 ${
                  isCurrent ? 'text-teal-deep' : 'text-gray-400'
                }`}
              >
                {getLabelForNode(i, questions)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
