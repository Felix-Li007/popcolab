import { getPersonalities } from '@/services/personality-service';
import type { PersonalityData } from '@/types/personality';
import PersonalitiesClient from './PersonalitiesClient';

export default async function PersonalitiesPage() {
  const personalities = await getPersonalities();

  return (
    <PersonalitiesClient
      initialData={personalities as PersonalityData[]}
      personalitiesCount={personalities.length}
    />
  );
}
