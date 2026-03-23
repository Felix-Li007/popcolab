import { prisma } from '@/libs/prisma-client';
import { MAX_CATEGORY_DEPTH, MAX_CATEGORY_LEVEL } from '@/constants/category';
import type { ExperienceCategory } from '@/types/category-type';

type CategoryRow = Awaited<ReturnType<typeof prisma.category.findMany>>[number];

type CategoryWithRelations = CategoryRow & {
  parent: { category_title: string } | null;
  _count: {
    children: number;
    experiences: number;
  };
};

type UpsertExperienceCategoryInput = {
  title: string;
  notes: string | null;
  status: string;
  parentId: number | null;
};

type CategoryParentRow = {
  id: number;
  parent_id: number | null;
};

export function mapExperienceCategoryRow(
  row: CategoryWithRelations
): ExperienceCategory {
  return {
    id: row.id,
    title: row.category_title,
    notes: row.category_notes,
    status: row.category_status,
    parentId: row.parent_id,
    parentTitle: row.parent?.category_title ?? null,
    childCount: row._count.children,
    linkedExperienceCount: row._count.experiences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getParentDepth(
  parentById: Map<number, number | null>,
  parentId: number
): number {
  let depth = 0;
  let cursor: number | null | undefined = parentById.get(parentId);

  while (cursor !== null && cursor !== undefined) {
    depth += 1;
    cursor = parentById.get(cursor);
  }

  return depth;
}

function assertCategoryIsNotOwnParent(
  categoryId: number | null,
  parentId: number | null
) {
  if (categoryId !== null && categoryId === parentId) {
    throw new Error('Category cannot be its own parent.');
  }
}

function assertParentCategoryExists(
  parentById: Map<number, number | null>,
  parentId: number
) {
  if (!parentById.has(parentId)) {
    throw new Error('Selected parent category no longer exists.');
  }
}

function assertCategoryIsNotMovedIntoDescendant(
  parentById: Map<number, number | null>,
  categoryId: number | null,
  parentId: number
) {
  if (categoryId === null) {
    return;
  }

  let cursor: number | null | undefined = parentId;
  while (cursor !== null && cursor !== undefined) {
    if (cursor === categoryId) {
      throw new Error(
        'Category cannot be moved under itself or one of its descendants.'
      );
    }
    cursor = parentById.get(cursor);
  }
}

function buildChildrenByParentId(rows: CategoryParentRow[]) {
  const childrenByParentId = new Map<number | null, number[]>();

  for (const row of rows) {
    const siblings = childrenByParentId.get(row.parent_id) ?? [];
    siblings.push(row.id);
    childrenByParentId.set(row.parent_id, siblings);
  }

  return childrenByParentId;
}

function getSubtreeHeight(
  childrenByParentId: Map<number | null, number[]>,
  categoryId: number
): number {
  const childIds = childrenByParentId.get(categoryId) ?? [];
  if (childIds.length === 0) {
    return 0;
  }

  return (
    1 +
    Math.max(
      ...childIds.map(childId => getSubtreeHeight(childrenByParentId, childId))
    )
  );
}

function assertCategoryDepthWithinLimit(params: {
  categoryId: number | null;
  parentId: number;
  parentById: Map<number, number | null>;
  rows: CategoryParentRow[];
}) {
  const parentDepth = getParentDepth(params.parentById, params.parentId);
  const childrenByParentId = buildChildrenByParentId(params.rows);
  const subtreeHeight =
    params.categoryId === null
      ? 0
      : getSubtreeHeight(childrenByParentId, params.categoryId);
  const deepestDepth = parentDepth + 1 + subtreeHeight;

  if (deepestDepth > MAX_CATEGORY_DEPTH) {
    throw new Error(
      `Categories support up to ${MAX_CATEGORY_LEVEL} levels only.`
    );
  }
}

async function assertValidParentAssignment(
  categoryId: number | null,
  parentId: number | null
): Promise<void> {
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      parent_id: true,
    },
  });
  const parentById = new Map(rows.map(row => [row.id, row.parent_id]));

  if (parentId === null) {
    return;
  }

  assertCategoryIsNotOwnParent(categoryId, parentId);
  assertParentCategoryExists(parentById, parentId);
  assertCategoryIsNotMovedIntoDescendant(parentById, categoryId, parentId);
  assertCategoryDepthWithinLimit({
    categoryId,
    parentId,
    parentById,
    rows,
  });
}

export async function getExperienceCategories(): Promise<ExperienceCategory[]> {
  const rows = await prisma.category.findMany({
    include: {
      parent: {
        select: {
          category_title: true,
        },
      },
      _count: {
        select: {
          children: true,
          experiences: true,
        },
      },
    },
    orderBy: [{ parent_id: 'asc' }, { category_title: 'asc' }, { id: 'asc' }],
  });

  return rows.map(mapExperienceCategoryRow);
}

export async function createExperienceCategory(
  input: UpsertExperienceCategoryInput
): Promise<void> {
  await assertValidParentAssignment(null, input.parentId);

  await prisma.category.create({
    data: {
      category_title: input.title,
      category_notes: input.notes,
      category_status: input.status,
      parent_id: input.parentId,
    },
  });
}

export async function updateExperienceCategory(
  id: number,
  input: UpsertExperienceCategoryInput
): Promise<void> {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('Category no longer exists.');
  }

  await assertValidParentAssignment(id, input.parentId);

  await prisma.category.update({
    where: { id },
    data: {
      category_title: input.title,
      category_notes: input.notes,
      category_status: input.status,
      parent_id: input.parentId,
    },
  });
}

export async function deleteExperienceCategory(id: number): Promise<void> {
  const [childCount, linkedExperienceCount] = await Promise.all([
    prisma.category.count({ where: { parent_id: id } }),
    prisma.experience.count({ where: { category_id: id } }),
  ]);

  if (childCount > 0) {
    throw new Error(
      'This parent category still has child categories. Delete or move them first.'
    );
  }

  if (linkedExperienceCount > 0) {
    throw new Error(
      'This category is linked to one or more experiences and cannot be deleted.'
    );
  }

  await prisma.category.delete({ where: { id } });
}

export { type ExperienceCategory as ExperienceCategoryData } from '@/types/category-type';
