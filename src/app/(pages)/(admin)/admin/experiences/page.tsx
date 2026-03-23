import { Suspense } from 'react';
import ExperienceContent from '@/components/admin/experience/experience-content';
import { getExperienceCategories } from '@/services/category-service';
import { getDimensions } from '@/services/dimension-service';
import { getExperiences } from '@/services/experience-service';
import { getProviders } from '@/services/provider-service';

export default async function ExperiencesPage() {
  const [experiences, providers, dimensions, categories] = await Promise.all([
    getExperiences(),
    getProviders(),
    getDimensions(),
    getExperienceCategories(),
  ]);

  return (
    <Suspense fallback={null}>
      <ExperienceContent
        initialData={experiences}
        providers={providers}
        dimensions={dimensions}
        categories={categories}
      />
    </Suspense>
  );
}
