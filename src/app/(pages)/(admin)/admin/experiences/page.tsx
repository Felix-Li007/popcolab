import { Suspense } from 'react';
import ExperienceContent from '@/components/admin/experience/experience-content';
import { getExperienceCategories } from '@/services/category-service';
import { getDimensions } from '@/services/dimension-service';
import { getExperiences } from '@/services/experience-service';
import { getProviders } from '@/services/provider-service';

type SearchParamsInput = Record<string, string | string[] | undefined>;

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExperiencesPage({
  searchParams,
}: Readonly<Props>) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getFirstValue(resolvedSearchParams.q)?.trim() ?? '';
  const [experiences, providers, dimensions, categories] = await Promise.all([
    getExperiences(search),
    getProviders(),
    getDimensions(),
    getExperienceCategories(),
  ]);

  return (
    <Suspense fallback={null}>
      <ExperienceContent
        initialData={experiences}
        initialSearch={search}
        providers={providers}
        dimensions={dimensions}
        categories={categories}
      />
    </Suspense>
  );
}
