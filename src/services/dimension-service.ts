import { prisma } from '@/libs/prisma-client';
import { DIMENSION_DATA_TYPES } from '@/types/dimension-type';
import type {
  Dimension,
  DimensionCategory,
  DimensionDataType,
  DimensionFormState,
  DimensionCategoryFormState,
  DimensionOption,
} from '@/types/dimension-type';
import type { FormName } from '@/types/question-type';

type UpsertDimensionInput = {
  indexKey: string | null;
  indexName: string;
  indexNotes: string | null;
  categoryId: number;
  dataType: DimensionDataType;
  hardFilter: boolean;
  scaleMin: number | null;
  scaleMax: number | null;
  options: DimensionOption[];
  formNames: FormName[];
  penaltyValue?: number | null;
};

type DimensionRow = Awaited<
  ReturnType<typeof prisma.dimensionIndex.findMany>
>[number];
type DimensionCategoryRow = Awaited<
  ReturnType<typeof prisma.dimensionCategory.findMany>
>[number];

type DimensionValidationFields = {
  indexKey: string;
  indexName: string;
  categoryId: number;
  dataType: string;
  scaleMin: number | null;
  scaleMax: number | null;
  options: DimensionOption[];
};

export function mapDimensionRow(
  row: DimensionRow & { category: { category_name: string } },
  options?: DimensionOption[],
  formNames?: FormName[]
): Dimension {
  return {
    id: row.id,
    indexKey: row.index_key,
    indexName: row.index_name,
    indexNotes: row.index_notes,
    categoryId: row.category_id,
    categoryName: row.category.category_name,
    dataType: row.data_type,
    hardFilter: row.hard_filter,
    scaleMin: row.scale_min,
    scaleMax: row.scale_max,
    penaltyValue: row.penalty_value == null ? null : Number(row.penalty_value),
    options: options ?? [],
    formNames: formNames ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCategoryRow(row: DimensionCategoryRow): DimensionCategory {
  return {
    id: row.id,
    name: row.category_name,
    description: row.category_desc,
  };
}

function getIndexNameError(indexName: string): string | undefined {
  if (!indexName) {
    return 'Dimension name is required';
  }

  if (indexName.length > 50) {
    return 'Dimension name must be 50 characters or less';
  }

  return undefined;
}

function getIndexKeyError(indexKey: string): string | undefined {
  if (!indexKey) {
    return undefined;
  }

  if (indexKey.length > 50) {
    return 'Dimension key must be 50 characters or less';
  }

  if (!/^[A-Z0-9_]+$/.test(indexKey)) {
    return 'Dimension key must contain only uppercase letters, numbers, or underscores';
  }

  return undefined;
}

function getCategoryIdError(categoryId: number): string | undefined {
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return 'Please select a category';
  }

  return undefined;
}

function getDataTypeError(dataType: string): string | undefined {
  if (
    ![
      DIMENSION_DATA_TYPES.NUMERIC,
      DIMENSION_DATA_TYPES.SCALE,
      DIMENSION_DATA_TYPES.TEXT,
    ].includes(dataType as DimensionDataType)
  ) {
    return 'Data type must be numeric, scale, or text';
  }

  return undefined;
}

function getScaleErrors(fields: DimensionValidationFields) {
  const errors: Pick<DimensionFormState['errors'], 'scaleMin' | 'scaleMax'> =
    {};

  if (fields.dataType !== DIMENSION_DATA_TYPES.SCALE) {
    return errors;
  }

  if (fields.scaleMin === null || Number.isNaN(fields.scaleMin)) {
    errors.scaleMin = 'Scale min is required for scale type';
  }

  if (fields.scaleMax === null || Number.isNaN(fields.scaleMax)) {
    errors.scaleMax = 'Scale max is required for scale type';
  }

  if (
    fields.scaleMin !== null &&
    fields.scaleMax !== null &&
    fields.scaleMin >= fields.scaleMax
  ) {
    errors.scaleMax = 'Scale max must be greater than scale min';
  }

  return errors;
}

function getOptionsError(options: DimensionOption[]): string | undefined {
  if (options.some(option => !option.label || !option.value)) {
    return 'Each option requires both a label and a value';
  }

  if (
    options.some(option => option.label.length > 50 || option.value.length > 50)
  ) {
    return 'Option label and value must be 50 characters or less';
  }

  return undefined;
}

export function validateDimensionFields(
  fields: DimensionValidationFields
): DimensionFormState['errors'] {
  const errors: DimensionFormState['errors'] = {};

  const indexNameError = getIndexNameError(fields.indexName);
  if (indexNameError) errors.indexName = indexNameError;

  const indexKeyError = getIndexKeyError(fields.indexKey);
  if (indexKeyError) errors.indexKey = indexKeyError;

  const categoryIdError = getCategoryIdError(fields.categoryId);
  if (categoryIdError) errors.categoryId = categoryIdError;

  const dataTypeError = getDataTypeError(fields.dataType);
  if (dataTypeError) errors.dataType = dataTypeError;

  const scaleErrors = getScaleErrors(fields);
  if (scaleErrors.scaleMin) errors.scaleMin = scaleErrors.scaleMin;
  if (scaleErrors.scaleMax) errors.scaleMax = scaleErrors.scaleMax;

  const optionsError = getOptionsError(fields.options);
  if (optionsError) errors.options = optionsError;

  return errors;
}

export function validateDimensionCategoryFields(fields: {
  name: string;
  description: string;
}): DimensionCategoryFormState['errors'] {
  const errors: DimensionCategoryFormState['errors'] = {};

  if (!fields.name) errors.name = 'Category name is required';
  else if (fields.name.length > 50)
    errors.name = 'Category name must be 50 characters or less';

  if (fields.description.length > 255) {
    errors.description = 'Description must be 255 characters or less';
  }

  return errors;
}

async function getOptionsByDimensionId(): Promise<
  Map<number, DimensionOption[]>
> {
  try {
    const optionRows = await prisma.$queryRaw<
      {
        id: number;
        dimension_id: number;
        option_label: string;
        option_value: string;
        penalty_value: string | null;
      }[]
    >`SELECT "id", "dimension_id", "option_label", "option_value", "penalty_value" FROM "dimension_option" ORDER BY "id" ASC`;

    const map = new Map<number, DimensionOption[]>();
    for (const row of optionRows) {
      const values = map.get(row.dimension_id) ?? [];
      values.push({
        id: row.id,
        label: row.option_label,
        value: row.option_value,
        penalty: row.penalty_value == null ? null : Number(row.penalty_value),
      });
      map.set(row.dimension_id, values);
    }
    return map;
  } catch {
    return new Map<number, DimensionOption[]>();
  }
}

async function getFormNamesByDimensionId(): Promise<Map<number, FormName[]>> {
  try {
    const rows = await prisma.$queryRaw<
      { dimension_id: number; form_name: string }[]
    >`SELECT "dimension_id", "form_name"::text AS "form_name" FROM "dimension_apply" ORDER BY "id" ASC`;

    const map = new Map<number, FormName[]>();
    for (const row of rows) {
      if (
        row.form_name !== 'REQUEST' &&
        row.form_name !== 'MEMBER' &&
        row.form_name !== 'ASSESS' &&
        row.form_name !== 'EXPERIENCE'
      ) {
        continue;
      }

      const forms = map.get(row.dimension_id) ?? [];
      if (!forms.includes(row.form_name)) {
        forms.push(row.form_name);
      }
      map.set(row.dimension_id, forms);
    }

    return map;
  } catch {
    return new Map<number, FormName[]>();
  }
}

async function replaceDimensionOptions(
  dimensionId: number,
  options: DimensionOption[]
): Promise<void> {
  try {
    await prisma.dimensionOption.deleteMany({
      where: { dimension_id: dimensionId },
    });

    if (options.length === 0) {
      return;
    }

    await prisma.dimensionOption.createMany({
      data: options.map(option => ({
        dimension_id: dimensionId,
        option_label: option.label,
        option_value: option.value,
        penalty_value: option.penalty ?? null,
      })),
    });
  } catch {
    // Keep core dimension fields editable even when option storage is not migrated.
  }
}

async function replaceDimensionFormNames(
  dimensionId: number,
  formNames: FormName[]
): Promise<void> {
  try {
    await prisma.dimensionApply.deleteMany({
      where: { dimension_id: dimensionId },
    });

    if (formNames.length === 0) {
      return;
    }

    await prisma.dimensionApply.createMany({
      data: formNames.map(formName => ({
        dimension_id: dimensionId,
        form_name: formName,
      })),
    });
  } catch {
    // Ignore when table/enum isn't migrated yet.
  }
}

export async function getDimensions(): Promise<Dimension[]> {
  const [optionsByDimensionId, formNamesByDimensionId, rows] =
    await Promise.all([
      getOptionsByDimensionId(),
      getFormNamesByDimensionId(),
      prisma.dimensionIndex.findMany({
        include: { category: true },
        orderBy: [{ category_id: 'asc' }, { id: 'asc' }],
      }),
    ]);

  return rows.map(row =>
    mapDimensionRow(
      row,
      optionsByDimensionId.get(row.id),
      formNamesByDimensionId.get(row.id)
    )
  );
}

export async function getDimensionCategories(): Promise<DimensionCategory[]> {
  const rows = await prisma.dimensionCategory.findMany({
    orderBy: [{ category_name: 'asc' }, { id: 'asc' }],
  });
  return rows.map(mapCategoryRow);
}

export async function getDimensionSummary(): Promise<{
  count: number;
  hardFilterCount: number;
  scaleCount: number;
  categoryCount: number;
}> {
  const [count, hardFilterCount, scaleCount, categoryCount] = await Promise.all(
    [
      prisma.dimensionIndex.count(),
      prisma.dimensionIndex.count({ where: { hard_filter: true } }),
      prisma.dimensionIndex.count({ where: { data_type: 'scale' } }),
      prisma.dimensionCategory.count(),
    ]
  );

  return { count, hardFilterCount, scaleCount, categoryCount };
}

export async function createDimension(
  input: UpsertDimensionInput
): Promise<number> {
  const created = await prisma.dimensionIndex.create({
    data: {
      index_key: input.indexKey,
      index_name: input.indexName,
      index_notes: input.indexNotes,
      category_id: input.categoryId,
      penalty_value: input.penaltyValue ?? null,
      data_type: input.dataType,
      hard_filter: input.hardFilter,
      scale_min: input.scaleMin,
      scale_max: input.scaleMax,
    },
  });

  await replaceDimensionOptions(created.id, input.options);
  await replaceDimensionFormNames(created.id, input.formNames);

  return created.id;
}

export async function updateDimension(
  id: number,
  input: UpsertDimensionInput
): Promise<void> {
  await prisma.dimensionIndex.update({
    where: { id },
    data: {
      index_key: input.indexKey,
      index_name: input.indexName,
      index_notes: input.indexNotes,
      penalty_value: input.penaltyValue ?? null,
      category_id: input.categoryId,
      data_type: input.dataType,
      hard_filter: input.hardFilter,
      scale_min: input.scaleMin,
      scale_max: input.scaleMax,
    },
  });

  await replaceDimensionOptions(id, input.options);
  await replaceDimensionFormNames(id, input.formNames);
}

export async function deleteDimension(id: number): Promise<void> {
  try {
    await prisma.$executeRaw`DELETE FROM "dimension_option" WHERE "dimension_id" = ${id}`;
  } catch {
    // Ignore when dimension_option table isn't migrated yet.
  }

  await prisma.$transaction([
    prisma.questionDimension.deleteMany({ where: { dimension_id: id } }),
    prisma.experienceDimension.deleteMany({ where: { dimension_id: id } }),
    prisma.requestPreference.deleteMany({ where: { dimension_id: id } }),
    prisma.responseScore.deleteMany({ where: { dimension_id: id } }),
    prisma.teamAggregate.deleteMany({ where: { dimension_id: id } }),
    prisma.dimensionIndex.delete({ where: { id } }),
  ]);
}

export async function createDimensionCategory(input: {
  name: string;
  description: string | null;
}): Promise<void> {
  await prisma.dimensionCategory.create({
    data: {
      category_name: input.name,
      category_desc: input.description,
    },
  });
}

export async function updateDimensionCategory(
  id: number,
  input: { name: string; description: string | null }
): Promise<void> {
  await prisma.dimensionCategory.update({
    where: { id },
    data: {
      category_name: input.name,
      category_desc: input.description,
    },
  });
}

export async function deleteDimensionCategory(id: number): Promise<void> {
  const usage = await prisma.dimensionIndex.count({
    where: { category_id: id },
  });
  if (usage > 0) {
    throw new Error('Category is in use by one or more dimensions.');
  }
  await prisma.dimensionCategory.delete({ where: { id } });
}

export {
  type Dimension as DimensionData,
  type DimensionCategory as DimensionCategoryData,
  type DimensionFormState,
  type DimensionCategoryFormState,
} from '@/types/dimension-type';
