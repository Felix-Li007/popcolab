import {
  getDimensionCategories,
  getDimensions,
  getDimensionSummary,
} from '@/services/dimension-service';
import type { Dimension, DimensionCategory } from '@/types/dimension-type';
import DimensionContent from '@/components/admin/dimension/dimension-content';

export default async function DimensionsPage() {
  const [dimensions, categories, summary] = await Promise.all([
    getDimensions(),
    getDimensionCategories(),
    getDimensionSummary(),
  ]);

  return (
    <DimensionContent
      initialData={dimensions as Dimension[]}
      categories={categories as DimensionCategory[]}
      summary={summary}
    />
  );
}
