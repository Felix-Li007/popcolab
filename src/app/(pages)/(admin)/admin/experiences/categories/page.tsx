import { Suspense } from 'react';
import ExperienceCategoryContent from '@/components/admin/experience/category-content';
import { getExperienceCategories } from '@/services/category-service';
import type { ExperienceCategory } from '@/types/category-type';

export default async function ExperienceCategoriesPage() {
  const categories = await getExperienceCategories();

  return (
    <Suspense fallback={null}>
      <ExperienceCategoryContent
        initialData={categories as ExperienceCategory[]}
      />
    </Suspense>
  );
}
