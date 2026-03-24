'use server';

import { revalidatePath } from 'next/cache';
import type {
  DimensionFormState,
  DimensionCategoryFormState,
  DimensionDataType,
} from '@/types/dimension-type';
import { DIMENSION_DATA_TYPES } from '@/types/dimension-type';
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
import {
  getFormEntryString,
  getTrimmedFormString,
  getTrimmedFormStrings,
} from '@/utils/form-data';

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
  const labels = getTrimmedFormStrings(formData, 'optionLabel');
  const values = getTrimmedFormStrings(formData, 'optionValue');
  const length = Math.max(labels.length, values.length);

  return Array.from({ length }, (_, index) => ({
    label: labels[index] ?? '',
    value: values[index] ?? '',
  })).filter(option => option.label || option.value);
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + (value.codePointAt(i) ?? 0)) >>> 0;
  }
  return hash.toString(36).toUpperCase();
}

function generateDimensionKey(indexName: string): string {
  const normalized = indexName
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '')
    .replaceAll(/_+/g, '_');

  if (normalized) return normalized.slice(0, 50);
  return `DIM_${hashString(indexName || 'DIMENSION')}`.slice(0, 50);
}

function parseDimensionForm(formData: FormData) {
  const indexName = getTrimmedFormString(formData, 'indexName');
  const indexNotesRaw = getTrimmedFormString(formData, 'indexNotes');
  const categoryId = Number.parseInt(
    getFormEntryString(formData.get('categoryId')) || '0',
    10
  );
  const dataType = getTrimmedFormString(formData, 'dataType');
  const hardFilterValue = getFormEntryString(formData.get('hardFilter'));
  const hardFilter = hardFilterValue === 'on' || hardFilterValue === 'true';
  const scaleMinRaw = getTrimmedFormString(formData, 'scaleMin');
  const scaleMaxRaw = getTrimmedFormString(formData, 'scaleMax');
  const options = parseOptions(formData);
  const formNames = formData
    .getAll('formName')
    .map(getFormEntryString)
    .filter(
      (value): value is IntakeForm =>
        value === 'REQUEST' ||
        value === 'MEMBER' ||
        value === 'ASSESS' ||
        value === 'EXPERIENCE'
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

  const dataType = parsed.dataType as DimensionDataType;

  const scaleMin =
    dataType === DIMENSION_DATA_TYPES.SCALE ? parsed.scaleMin : null;
  const scaleMax =
    dataType === DIMENSION_DATA_TYPES.SCALE ? parsed.scaleMax : null;

  try {
    await createDimension({
      ...parsed,
      dataType,
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

  const dataType = parsed.dataType as DimensionDataType;

  const scaleMin =
    dataType === DIMENSION_DATA_TYPES.SCALE ? parsed.scaleMin : null;
  const scaleMax =
    dataType === DIMENSION_DATA_TYPES.SCALE ? parsed.scaleMax : null;

  try {
    await updateDimension(id, {
      ...parsed,
      dataType,
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
  const name = getTrimmedFormString(formData, 'name');
  const description = getTrimmedFormString(formData, 'description');
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
