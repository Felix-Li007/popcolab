'use server';

import { revalidatePath } from 'next/cache';
import type {
  DimensionFormState,
  DimensionCategoryFormState,
} from '@/types/dimension-type';
import type { IntakeForm } from '@/types/question-type';
import {
  createDimension,
  updateDimension,
  deleteDimension,
  validateDimensionFields,
  createDimensionCategory,
  updateDimensionCategory,
  deleteDimensionCategory,
  validateDimensionCategoryFields,
} from '@/services/dimension-service';

const ADMIN_PATHS = [
  '/admin',
  '/admin/dimensions',
  '/admin/dimensions/categories',
  '/admin/questions',
];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function parseOptions(formData: FormData) {
  const labels = formData.getAll('optionLabel').map(v => v.toString().trim());
  const values = formData.getAll('optionValue').map(v => v.toString().trim());
  const length = Math.max(labels.length, values.length);

  return Array.from({ length }, (_, index) => ({
    label: labels[index] ?? '',
    value: values[index] ?? '',
  })).filter(option => option.label || option.value);
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase();
}

function generateDimensionKey(indexName: string): string {
  const normalized = indexName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  if (normalized) return normalized.slice(0, 50);
  return `DIM_${hashString(indexName || 'DIMENSION')}`.slice(0, 50);
}

function parseDimensionForm(formData: FormData) {
  const indexName = formData.get('indexName')?.toString().trim() ?? '';
  const indexNotesRaw = formData.get('indexNotes')?.toString().trim() ?? '';
  const categoryId = parseInt(
    formData.get('categoryId')?.toString() ?? '0',
    10
  );
  const dataType = formData.get('dataType')?.toString().trim() ?? '';
  const hardFilter =
    formData.get('hardFilter')?.toString() === 'on' ||
    formData.get('hardFilter')?.toString() === 'true';
  const scaleMinRaw = formData.get('scaleMin')?.toString().trim() ?? '';
  const scaleMaxRaw = formData.get('scaleMax')?.toString().trim() ?? '';
  const options = parseOptions(formData);
  const formNames = formData
    .getAll('formName')
    .map(value => value.toString())
    .filter(
      (value): value is IntakeForm =>
        value === 'REQUEST' || value === 'USER' || value === 'PLAY'
    );

  const scaleMin = scaleMinRaw === '' ? null : Number(scaleMinRaw);
  const scaleMax = scaleMaxRaw === '' ? null : Number(scaleMaxRaw);

  return {
    indexKey: generateDimensionKey(indexName),
    indexName,
    indexNotes: indexNotesRaw === '' ? null : indexNotesRaw,
    categoryId,
    dataType,
    hardFilter,
    scaleMin,
    scaleMax,
    options,
    formNames,
  };
}

export async function createDimensionAction(
  _prevState: DimensionFormState,
  formData: FormData
): Promise<DimensionFormState> {
  const parsed = parseDimensionForm(formData);
  const errors = validateDimensionFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  const scaleMin = parsed.dataType === 'scale' ? parsed.scaleMin : null;
  const scaleMax = parsed.dataType === 'scale' ? parsed.scaleMax : null;

  try {
    await createDimension({
      ...parsed,
      indexKey: parsed.indexKey || null,
      scaleMin,
      scaleMax,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to create dimension. Please try again.' },
    };
  }
}

export async function updateDimensionAction(
  id: number,
  _prevState: DimensionFormState,
  formData: FormData
): Promise<DimensionFormState> {
  const parsed = parseDimensionForm(formData);
  const errors = validateDimensionFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  const scaleMin = parsed.dataType === 'scale' ? parsed.scaleMin : null;
  const scaleMax = parsed.dataType === 'scale' ? parsed.scaleMax : null;

  try {
    await updateDimension(id, {
      ...parsed,
      indexKey: parsed.indexKey || null,
      scaleMin,
      scaleMax,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to update dimension. Please try again.' },
    };
  }
}

export async function deleteDimensionAction(id: number): Promise<void> {
  await deleteDimension(id);
  revalidateAdminPaths();
}

function parseCategoryForm(formData: FormData) {
  const name = formData.get('name')?.toString().trim() ?? '';
  const description = formData.get('description')?.toString().trim() ?? '';
  return {
    name,
    description,
  };
}

export async function createDimensionCategoryAction(
  _prevState: DimensionCategoryFormState,
  formData: FormData
): Promise<DimensionCategoryFormState> {
  const parsed = parseCategoryForm(formData);
  const errors = validateDimensionCategoryFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createDimensionCategory({
      name: parsed.name,
      description: parsed.description || null,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to create category. Please try again.' },
    };
  }
}

export async function updateDimensionCategoryAction(
  id: number,
  _prevState: DimensionCategoryFormState,
  formData: FormData
): Promise<DimensionCategoryFormState> {
  const parsed = parseCategoryForm(formData);
  const errors = validateDimensionCategoryFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updateDimensionCategory(id, {
      name: parsed.name,
      description: parsed.description || null,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to update category. Please try again.' },
    };
  }
}

export async function deleteDimensionCategoryAction(id: number): Promise<void> {
  await deleteDimensionCategory(id);
  revalidateAdminPaths();
}
