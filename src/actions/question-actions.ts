'use server';

import { revalidatePath } from 'next/cache';
import type {
  QuestionType,
  QuestionData,
  QuestionOptionData,
  QuestionDimensionData,
  DimensionIndexData,
  QuestionFormState,
} from '@/types/question';
import {
  getAvailableDimensions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/services/question-service';

export type {
  QuestionType,
  QuestionData,
  QuestionOptionData,
  QuestionDimensionData,
  DimensionIndexData,
  QuestionFormState,
};

// ─── Form Data Parsers ────────────────────────────────────────────────────────

function parseOptions(formData: FormData): QuestionOptionData[] {
  const labels = formData.getAll('option_label') as string[];
  const values = formData.getAll('option_value') as string[];
  const scores = formData.getAll('option_score') as string[];

  return labels
    .map((label, i) => ({
      label: label.trim(),
      value: values[i]?.trim() ?? '',
      score: scores[i] ? parseFloat(scores[i]) : null,
    }))
    .filter(o => o.label !== '');
}

function parseDimensions(
  formData: FormData
): { dimensionId: number; weight: number | null }[] {
  const ids = formData.getAll('dim_id') as string[];
  const weights = formData.getAll('dim_weight') as string[];

  return ids
    .map((id, i) => ({
      dimensionId: parseInt(id),
      weight: weights[i] ? parseFloat(weights[i]) : null,
    }))
    .filter(d => !isNaN(d.dimensionId));
}

export async function getDimensionIndexesAction(): Promise<
  DimensionIndexData[]
> {
  return getAvailableDimensions();
}

// ─── CREATE ────────────────────────────────────────────────────────────────────

export async function createQuestionAction(
  _prevState: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  const text = (formData.get('text') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() ?? '';
  const type = (formData.get('type') as string)?.trim() as QuestionType;
  const orderIndex = formData.get('order_index')
    ? parseInt(formData.get('order_index') as string)
    : null;

  const errors: QuestionFormState['errors'] = {};
  if (!text) errors.text = 'Question text is required.';
  if (!type) errors.type = 'Question type is required.';
  if (Object.keys(errors).length > 0) return { errors };

  const options = parseOptions(formData);
  if (
    (type === 'single_choice' || type === 'multi_choice') &&
    options.length < 2
  ) {
    return {
      errors: {
        options: 'At least 2 options are required for choice questions.',
      },
    };
  }

  const dimensions = parseDimensions(formData);

  try {
    await createQuestion({
      text,
      description,
      type,
      orderIndex,
      options,
      dimensions,
    });
    revalidatePath('/admin/surveys');
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to create question. Please try again.' },
    };
  }
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateQuestionAction(
  id: number,
  _prevState: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  const text = (formData.get('text') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() ?? '';
  const type = (formData.get('type') as string)?.trim() as QuestionType;
  const orderIndex = formData.get('order_index')
    ? parseInt(formData.get('order_index') as string)
    : null;

  const errors: QuestionFormState['errors'] = {};
  if (!text) errors.text = 'Question text is required.';
  if (!type) errors.type = 'Question type is required.';
  if (Object.keys(errors).length > 0) return { errors };

  const options = parseOptions(formData);
  if (
    (type === 'single_choice' || type === 'multi_choice') &&
    options.length < 2
  ) {
    return {
      errors: {
        options: 'At least 2 options are required for choice questions.',
      },
    };
  }

  const dimensions = parseDimensions(formData);

  try {
    await updateQuestion(id, {
      text,
      description,
      type,
      orderIndex,
      options,
      dimensions,
    });
    revalidatePath('/admin/surveys');
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to update question. Please try again.' },
    };
  }
}

export async function deleteQuestionAction(id: number): Promise<void> {
  await deleteQuestion(id);
  revalidatePath('/admin/surveys');
}
