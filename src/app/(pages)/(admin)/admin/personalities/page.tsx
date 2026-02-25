import { getPersonalities } from '@/services/personality-service';
import type { Personality } from '@/types/personality-type';
import PersonalityContent from '@/components/admin/personality/personality-content';

export default async function PersonalitiesPage() {
  const personalities = await getPersonalities();

  return <PersonalityContent initialData={personalities as Personality[]} />;
}
