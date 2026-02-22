import type { QuestionType } from '@/types/question-type';

export type UserAnswer = {
  questionId: number;
  questionType: QuestionType;
  selectedOptionIds: number[]; // for single_choice / multi_choice
  scaleValue: number | null; // for scale
};

export type TestSubmitResult = {
  success: boolean;
  error?: string;
};
