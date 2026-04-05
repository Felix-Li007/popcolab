'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/libs/prisma-client';
import { createModuleLogger } from '@/utils/logging-util';
import type {
  DimensionFormState,
  DimensionCategoryFormState,
  DimensionDataType,
} from '@/types/dimension-type';
import { DIMENSION_DATA_TYPES } from '@/types/dimension-type';
import type { FormName } from '@/types/question-type';
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

const logger = createModuleLogger(import.meta.url);

async function logDimensionReadback(id: number, label: string) {
  const row = await prisma.dimensionIndex.findUnique({
    where: { id },
    select: {
      id: true,
      index_name: true,
      index_notes: true,
      category_id: true,
      data_type: true,
      hard_filter: true,
      updated_at: true,
    },
  });

  logger.debug({ row }, label);
}

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function parseOptions(formData: FormData) {
  const labels = getTrimmedFormStrings(formData, 'optionLabel');
  const values = getTrimmedFormStrings(formData, 'optionValue');
  const penalties = getTrimmedFormStrings(formData, 'optionPenalty');
  const length = Math.max(labels.length, values.length, penalties.length);

  return Array.from({ length }, (_, index) => {
    const penaltyRaw = penalties[index] ?? '';
    const penalty = penaltyRaw === '' ? null : Number(penaltyRaw);
    return {
      label: labels[index] ?? '',
      value: values[index] ?? '',
      penalty,
    };
  }).filter(option => option.label || option.value);
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
      (value): value is FormName =>
        value === 'REQUEST' ||
        value === 'MEMBER' ||
        value === 'ASSESS' ||
        value === 'EXPERIENCE'
    );

  const scaleMin = scaleMinRaw === '' ? null : Number(scaleMinRaw);
  const scaleMax = scaleMaxRaw === '' ? null : Number(scaleMaxRaw);
  const penaltyValueRaw = getTrimmedFormString(formData, 'penaltyValue');
  const penaltyValue = penaltyValueRaw === '' ? null : Number(penaltyValueRaw);

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
    penaltyValue,
    formNames,
  };
}

export async function createDimensionAction(
  _prevState: DimensionFormState,
  formData: FormData
): Promise<DimensionFormState> {
  logger.debug('[dimension-action] createDimensionAction: entered');
  const parsed = parseDimensionForm(formData);
  logger.debug(
    {
      indexName: parsed.indexName,
      indexNotes: parsed.indexNotes,
      categoryId: parsed.categoryId,
      dataType: parsed.dataType,
      hardFilter: parsed.hardFilter,
      formNames: parsed.formNames,
      optionCount: parsed.options.length,
    },
    '[dimension-action] createDimensionAction: parsed'
  );
  const errors = validateDimensionFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  const dataType = parsed.dataType as DimensionDataType;

  const scaleMin =
    dataType === DIMENSION_DATA_TYPES.SCALE ? parsed.scaleMin : null;
  const scaleMax =
    dataType === DIMENSION_DATA_TYPES.SCALE ? parsed.scaleMax : null;

  try {
    const createdId = await createDimension({
      ...parsed,
      dataType,
      indexKey: parsed.indexKey || null,
      scaleMin,
      scaleMax,
    });
    logger.info('[dimension-action] createDimensionAction: persisted');
    await logDimensionReadback(
      createdId,
      '[dimension-action] createDimensionAction: readback'
    );
    revalidateAdminPaths();
    logger.debug('[dimension-action] createDimensionAction: revalidated');
    return { errors: {}, success: true };
  } catch (error) {
    logger.error({ error }, '[dimension-action] createDimensionAction: failed');
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
  logger.debug({ id }, '[dimension-action] updateDimensionAction: entered');
  const parsed = parseDimensionForm(formData);
  logger.debug(
    {
      id,
      indexName: parsed.indexName,
      indexNotes: parsed.indexNotes,
      categoryId: parsed.categoryId,
      dataType: parsed.dataType,
      hardFilter: parsed.hardFilter,
      formNames: parsed.formNames,
      optionCount: parsed.options.length,
    },
    '[dimension-action] updateDimensionAction: parsed'
  );
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
    logger.info({ id }, '[dimension-action] updateDimensionAction: persisted');
    await logDimensionReadback(
      id,
      '[dimension-action] updateDimensionAction: readback'
    );
    revalidateAdminPaths();
    logger.debug(
      { id },
      '[dimension-action] updateDimensionAction: revalidated'
    );
    return { errors: {}, success: true };
  } catch (error) {
    logger.error(
      { id, error },
      '[dimension-action] updateDimensionAction: failed'
    );
    return {
      errors: { _form: 'Failed to update dimension. Please try again.' },
    };
  }
}

export async function saveDimensionAction(
  prevState: DimensionFormState,
  formData: FormData
): Promise<DimensionFormState> {
  const dimensionIdValue = getFormEntryString(formData.get('dimensionId'));
  const dimensionId = Number.parseInt(dimensionIdValue || '0', 10);
  const rawIndexNotes = getFormEntryString(formData.get('indexNotes'));

  logger.debug(
    { dimensionIdValue, dimensionId, rawIndexNotes },
    '[dimension-action] saveDimensionAction: route'
  );

  if (Number.isInteger(dimensionId) && dimensionId > 0) {
    return updateDimensionAction(dimensionId, prevState, formData);
  }

  return createDimensionAction(prevState, formData);
}

export async function saveDimensionCategoryAction(
  prevState: DimensionCategoryFormState,
  formData: FormData
): Promise<DimensionCategoryFormState> {
  const categoryIdValue = getFormEntryString(
    formData.get('dimensionCategoryId')
  );
  const categoryId = Number.parseInt(categoryIdValue || '0', 10);

  logger.debug(
    { categoryIdValue, categoryId },
    '[dimension-action] saveDimensionCategoryAction: route'
  );

  if (Number.isInteger(categoryId) && categoryId > 0) {
    return updateDimensionCategoryAction(categoryId, prevState, formData);
  }

  return createDimensionCategoryAction(prevState, formData);
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
  logger.debug('[dimension-action] createDimensionCategoryAction: entered');
  const parsed = parseCategoryForm(formData);
  logger.debug(
    parsed,
    '[dimension-action] createDimensionCategoryAction: parsed'
  );
  const errors = validateDimensionCategoryFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createDimensionCategory({
      name: parsed.name,
      description: parsed.description || null,
    });
    logger.info('[dimension-action] createDimensionCategoryAction: persisted');
    revalidateAdminPaths();
    logger.debug(
      '[dimension-action] createDimensionCategoryAction: revalidated'
    );
    return { errors: {}, success: true };
  } catch (error) {
    logger.error(
      { error },
      '[dimension-action] createDimensionCategoryAction: failed'
    );
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
  logger.debug(
    { id },
    '[dimension-action] updateDimensionCategoryAction: entered'
  );
  const parsed = parseCategoryForm(formData);
  logger.debug(
    { id, ...parsed },
    '[dimension-action] updateDimensionCategoryAction: parsed'
  );
  const errors = validateDimensionCategoryFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updateDimensionCategory(id, {
      name: parsed.name,
      description: parsed.description || null,
    });
    logger.info(
      { id },
      '[dimension-action] updateDimensionCategoryAction: persisted'
    );
    revalidateAdminPaths();
    logger.debug(
      { id },
      '[dimension-action] updateDimensionCategoryAction: revalidated'
    );
    return { errors: {}, success: true };
  } catch (error) {
    logger.error(
      { id, error },
      '[dimension-action] updateDimensionCategoryAction: failed'
    );
    return {
      errors: { _form: 'Failed to update category. Please try again.' },
    };
  }
}

export async function deleteDimensionCategoryAction(id: number): Promise<void> {
  await deleteDimensionCategory(id);
  revalidateAdminPaths();
}
