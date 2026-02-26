import { prisma } from '@/libs/prisma-client';
import type {
  Dimension,
  DimensionCategory,
  DimensionDataType,
  DimensionFormState,
  DimensionCategoryFormState,
  DimensionOption,
} from '@/types/dimension-type';

export type {
  Dimension as DimensionData,
  DimensionCategory as DimensionCategoryData,
  DimensionFormState,
  DimensionCategoryFormState,
};

type UpsertDimensionInput = {
  indexKey: string | null;
  indexName: string;
  indexNotes: string | null;
  categoryId: number;
  dataType: string;
  hardFilter: boolean;
  scaleMin: number | null;
  scaleMax: number | null;
  options: string[];
};

type DimensionRow = Awaited<
  ReturnType<typeof prisma.dimensionIndex.findMany>
>[number];
type DimensionCategoryRow = Awaited<
  ReturnType<typeof prisma.dimensionCategory.findMany>
>[number];

function mapOptions(values: string[]): DimensionOption[] {
  return values.map(value => ({ value }));
}

export function mapDimensionRow(
  row: DimensionRow & { category: { category_name: string } },
  indexNotes?: string | null,
  options?: string[]
): Dimension {
  return {
    id: row.id,
    indexKey: row.index_key,
    indexName: row.index_name,
    // Optional until all environments run migration for this new column.
    indexNotes: indexNotes ?? null,
    categoryId: row.category_id,
    categoryName: row.category.category_name,
    dataType: row.data_type,
    hardFilter: row.hard_filter,
    scaleMin: row.scale_min,
    scaleMax: row.scale_max,
    options: mapOptions(options ?? []),
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

export function validateDimensionFields(fields: {
  indexKey: string;
  indexName: string;
  categoryId: number;
  dataType: string;
  scaleMin: number | null;
  scaleMax: number | null;
  options: string[];
}): DimensionFormState['errors'] {
  const errors: DimensionFormState['errors'] = {};
  const normalizedType = fields.dataType as DimensionDataType;

  if (!fields.indexName) errors.indexName = 'Dimension name is required';
  else if (fields.indexName.length > 50)
    errors.indexName = 'Dimension name must be 50 characters or less';

  if (fields.indexKey && fields.indexKey.length > 50)
    errors.indexKey = 'Dimension key must be 50 characters or less';
  else if (fields.indexKey && !/^[A-Z0-9_]+$/.test(fields.indexKey))
    errors.indexKey =
      'Dimension key must contain only uppercase letters, numbers, or underscores';

  if (!Number.isInteger(fields.categoryId) || fields.categoryId <= 0) {
    errors.categoryId = 'Please select a category';
  }

  if (!['numeric', 'scale', 'text'].includes(normalizedType)) {
    errors.dataType = 'Data type must be numeric, scale, or text';
  }

  if (normalizedType === 'scale') {
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
  }

  if (fields.options.some(v => v.length > 100)) {
    errors.options = 'Each option must be 100 characters or less';
  }

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

async function getIndexNotesById(): Promise<Map<number, string | null>> {
  try {
    const noteRows = await prisma.$queryRaw<
      { id: number; index_notes: string | null }[]
    >`SELECT "id", "index_notes" FROM "dimension_index"`;
    return new Map(noteRows.map(r => [r.id, r.index_notes]));
  } catch {
    return new Map<number, string | null>();
  }
}

async function getOptionsByDimensionId(): Promise<Map<number, string[]>> {
  try {
    const optionRows = await prisma.$queryRaw<
      { dimension_id: number; allowed_value: string }[]
    >`SELECT "dimension_id", "allowed_value" FROM "dimension_option" ORDER BY "id" ASC`;

    const map = new Map<number, string[]>();
    for (const row of optionRows) {
      const values = map.get(row.dimension_id) ?? [];
      values.push(row.allowed_value);
      map.set(row.dimension_id, values);
    }
    return map;
  } catch {
    return new Map<number, string[]>();
  }
}

async function replaceDimensionOptions(
  dimensionId: number,
  options: string[]
): Promise<void> {
  try {
    await prisma.$executeRaw`DELETE FROM "dimension_option" WHERE "dimension_id" = ${dimensionId}`;
    for (const value of options) {
      await prisma.$executeRaw`INSERT INTO "dimension_option" ("dimension_id", "allowed_value", "created_at", "updated_at") VALUES (${dimensionId}, ${value}, NOW(), NOW())`;
    }
  } catch {
    // Ignore when table/column isn't migrated yet.
  }
}

export async function getDimensions(): Promise<Dimension[]> {
  const [indexNotesById, optionsByDimensionId, rows] = await Promise.all([
    getIndexNotesById(),
    getOptionsByDimensionId(),
    prisma.dimensionIndex.findMany({
      include: { category: true },
      orderBy: [{ category_id: 'asc' }, { id: 'asc' }],
    }),
  ]);

  return rows.map(row =>
    mapDimensionRow(
      row,
      indexNotesById.get(row.id),
      optionsByDimensionId.get(row.id)
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
): Promise<void> {
  const created = await prisma.dimensionIndex.create({
    data: {
      index_key: input.indexKey,
      index_name: input.indexName,
      category_id: input.categoryId,
      data_type: input.dataType,
      hard_filter: input.hardFilter,
      scale_min: input.scaleMin,
      scale_max: input.scaleMax,
    },
  });

  try {
    await prisma.$executeRaw`UPDATE "dimension_index" SET "index_notes" = ${input.indexNotes} WHERE "id" = ${created.id}`;
  } catch {
    // Ignore when index_notes column is not yet migrated.
  }

  await replaceDimensionOptions(created.id, input.options);
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
      category_id: input.categoryId,
      data_type: input.dataType,
      hard_filter: input.hardFilter,
      scale_min: input.scaleMin,
      scale_max: input.scaleMax,
    },
  });

  try {
    await prisma.$executeRaw`UPDATE "dimension_index" SET "index_notes" = ${input.indexNotes} WHERE "id" = ${id}`;
  } catch {
    // Ignore when index_notes column is not yet migrated.
  }

  await replaceDimensionOptions(id, input.options);
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
