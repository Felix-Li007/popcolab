import { Suspense } from 'react';
import {
  getDimensionCategories,
  getDimensions,
  getDimensionSummary,
} from '@/services/dimension-service';
import DimensionContent from '@/components/admin/dimension/dimension-content';

export default async function DimensionsPage() {
  const [dimensions, categories, summary] = await Promise.all([
    getDimensions(),
    getDimensionCategories(),
    getDimensionSummary(),
  ]);

  return (
    <Suspense fallback={null}>
      <DimensionContent
        initialData={dimensions}
        categories={categories}
        summary={summary}
      />
    </Suspense>
  );
}
