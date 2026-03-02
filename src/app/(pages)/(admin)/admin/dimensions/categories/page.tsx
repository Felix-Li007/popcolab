import { Suspense } from 'react';
import CategoryContent from '@/components/admin/dimension/category-content';
import {
  getDimensionCategories,
  getDimensions,
} from '@/services/dimension-service';
import type { DimensionCategory } from '@/types/dimension-type';

type CategoryWithUsage = DimensionCategory & { usageCount: number };

export default async function DimensionCategoriesPage() {
  const [categories, dimensions] = await Promise.all([
    getDimensionCategories(),
    getDimensions(),
  ]);

  const usageMap = dimensions.reduce<Map<number, number>>((acc, dimension) => {
    acc.set(dimension.categoryId, (acc.get(dimension.categoryId) ?? 0) + 1);
    return acc;
  }, new Map());

  const data: CategoryWithUsage[] = categories.map(category => ({
    ...category,
    usageCount: usageMap.get(category.id) ?? 0,
  }));

  return (
    <Suspense fallback={null}>
      <CategoryContent initialData={data} />
    </Suspense>
  );
}
