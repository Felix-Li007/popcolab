import { getPersonalities } from '@/services/personality-service';
import type { PersonalityType } from '@/types/personality-type';
import PersonalityContent from '@/components/admin/personality/personality-content';

export default async function PersonalitiesPage() {
  const personalities = await getPersonalities();

  return (
    <PersonalityContent
      initialData={personalities as PersonalityType[]}
      personalitiesCount={personalities.length}
    />
  );
}
