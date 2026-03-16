import { prisma } from '@/libs/prisma-client';
import { MAX_CATEGORY_DEPTH, MAX_CATEGORY_LEVEL } from '@/constants/category';
import type { ExperienceCategory } from '@/types/category-type';

export type { ExperienceCategory as ExperienceCategoryData };

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

  if (parentId === null) return;

  if (categoryId !== null && categoryId === parentId) {
    throw new Error('Category cannot be its own parent.');
  }

  if (!parentById.has(parentId)) {
    throw new Error('Selected parent category no longer exists.');
  }

  let parentDepth = 0;
  let cursor: number | null | undefined = parentById.get(parentId);

  while (cursor !== null && cursor !== undefined) {
    parentDepth += 1;
    cursor = parentById.get(cursor);
  }

  if (categoryId !== null) {
    cursor = parentId;
    while (cursor !== null && cursor !== undefined) {
      if (cursor === categoryId) {
        throw new Error(
          'Category cannot be moved under itself or one of its descendants.'
        );
      }
      cursor = parentById.get(cursor);
    }
  }

  const childrenByParentId = new Map<number | null, number[]>();
  for (const row of rows) {
    const siblings = childrenByParentId.get(row.parent_id) ?? [];
    siblings.push(row.id);
    childrenByParentId.set(row.parent_id, siblings);
  }

  const getSubtreeHeight = (id: number): number => {
    const childIds = childrenByParentId.get(id) ?? [];
    if (childIds.length === 0) return 0;
    return 1 + Math.max(...childIds.map(getSubtreeHeight));
  };

  const subtreeHeight = categoryId !== null ? getSubtreeHeight(categoryId) : 0;
  const deepestDepth = parentDepth + 1 + subtreeHeight;

  if (deepestDepth > MAX_CATEGORY_DEPTH) {
    throw new Error(
      `Categories support up to ${MAX_CATEGORY_LEVEL} levels only.`
    );
  }
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
