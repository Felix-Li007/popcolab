'use server';

import { revalidatePath } from 'next/cache';
import type {
  QuestionType,
  QuestionOption,
  DimensionIndex,
  QuestionFormState,
} from '@/types/question-type';
import {
  getAvailableDimensions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/services/question-service';

// ─── Form Data Parsers ────────────────────────────────────────────────────────

function parseOptions(formData: FormData): QuestionOption[] {
  const labels = formData.getAll('option_label') as string[];
  const values = formData.getAll('option_value') as string[];
  const scores = formData.getAll('option_score') as string[];

  return labels
    .map((label, i) => ({
      label: label.trim(),
      value: values[i]?.trim() ?? '',
      score: scores[i] ? Number.parseFloat(scores[i]) : null,
    }))
    .filter(o => o.label !== '');
}

function parseDimensions(
  formData: FormData
): { dimensionId: number; weight: number | null }[] {
  const ids = formData.getAll('dim_id') as string[];
  const weights = formData.getAll('dim_weight') as string[];

  const dimensions = ids
    .map((id, i) => ({
      dimensionId: Number.parseInt(id, 10),
      weight: weights[i] ? Number.parseFloat(weights[i]) : null,
    }))
    .filter(d => !Number.isNaN(d.dimensionId));

  return dimensions.length > 0 ? [dimensions[0]] : [];
}

export async function getDimensionIndexesAction(): Promise<DimensionIndex[]> {
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
    ? Number.parseInt(formData.get('order_index') as string, 10)
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
    revalidatePath('/admin/questions');
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
    ? Number.parseInt(formData.get('order_index') as string, 10)
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
    revalidatePath('/admin/questions');
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to update question. Please try again.' },
    };
  }
}

export async function deleteQuestionAction(id: number): Promise<void> {
  await deleteQuestion(id);
  revalidatePath('/admin/questions');
}
