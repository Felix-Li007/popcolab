import {
  createPersonalityAction,
  deletePersonalityAction,
  updatePersonalityAction,
} from '@/actions/personality-actions';
import { getPersonalities } from '@/services/personality-service';
import PersonalityContent from '@/components/admin/personality/personality-content';

export default async function PersonalitiesPage() {
  const personalities = await getPersonalities();

  return (
    <PersonalityContent
      initialData={personalities}
      personalityActions={{
        createPersonalityAction,
        updatePersonalityAction,
        deletePersonalityAction,
      }}
    />
  );
}
