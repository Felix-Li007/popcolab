'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitTestAction } from '@/actions/response-actions';
import type { Question } from '@/types/question-type';
import type { UserAnswer } from '@/types/response-type';
import TestProgress from './test-progress';
import QuestionStep from './question-step';

type Props = {
  questions: Question[];
};

export default function PersonalityTest({ questions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, UserAnswer>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const hasAnswered = answers.has(question.id!);

  // multi_choice: allow proceeding with 0 selections
  // text_input: require 1–100 words
  const canProceed = (() => {
    if (question.type === 'multi_choice') return true;
    if (question.type === 'text_input') {
      const t = answers.get(question.id!)?.textValue ?? '';
      const wc = t.trim() === '' ? 0 : t.trim().split(/\s+/).length;
      return wc >= 1 && wc <= 100;
    }
    return hasAnswered;
  })();

  function handleAnswer(answer: UserAnswer) {
    setAnswers(prev => new Map(prev).set(answer.questionId, answer));
  }

  function handleNext() {
    if (isLast) {
      handleSubmit();
      return;
    }
    setCurrentIndex(i => i + 1);
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }

  function handleSubmit() {
    const answersArray = Array.from(answers.values());
    setError(null);
    startTransition(async () => {
      const result = await submitTestAction(answersArray);
      if (result.success) {
        router.push(
          `/test/result?matches=${encodeURIComponent(result.matches ?? '')}`
        );
      } else {
        setError(result.error ?? 'Something went wrong. Please try again.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <TestProgress
        current={currentIndex + 1}
        total={questions.length}
        currentType={question.type}
      />

      <QuestionStep
        question={question}
        answer={answers.get(question.id!)}
        onAnswerAction={handleAnswer}
      />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed || isPending}
          className="px-6 py-2 text-sm font-semibold text-white rounded-lg bg-teal-deep hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? 'Submitting...' : isLast ? 'See My Result' : 'Next'}
        </button>
      </div>
    </div>
  );
}
