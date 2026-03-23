'use client';

import type { QuestionType } from '@/types/question-type';

type Props = {
  current: number;
  total: number;
  currentType: QuestionType;
};

const MILESTONE_MESSAGES = [
  null,
  'Halfway through!',
  'Almost there!',
  'One more to go!',
];

const NODE_LABELS: string[] = ['Choice', 'Multi-Select', 'Scale', 'Reflection'];

const TYPE_TO_NODE: Record<QuestionType, number> = {
  single_choice: 0,
  multi_choice: 1,
  scale: 2,
  text_input: 3,
};

const NODE_COUNT = 4;

function getNodeClassName(isCompleted: boolean, isCurrent: boolean) {
  if (isCompleted) {
    return 'bg-teal-deep text-white';
  }

  if (isCurrent) {
    return 'bg-teal-deep text-white ring-4 ring-teal-deep/20';
  }

  return 'bg-gray-200 text-gray-400';
}

export default function TestProgress({
  current,
  total,
  currentType,
}: Readonly<Props>) {
  const activeNodeIndex = TYPE_TO_NODE[currentType] ?? 0;
  const currentMessage = MILESTONE_MESSAGES[activeNodeIndex];
  const lineFill = (activeNodeIndex / (NODE_COUNT - 1)) * 100;

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
        {NODE_LABELS.map((label, i) => {
          const isCompleted = i < activeNodeIndex;
          const isCurrent = i === activeNodeIndex;

          return (
            <div
              key={label}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${getNodeClassName(
                  isCompleted,
                  isCurrent
                )}`}
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
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
