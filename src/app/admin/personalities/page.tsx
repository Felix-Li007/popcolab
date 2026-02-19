import { prisma } from '@/libs/prisma-client';
import { type PersonalityData } from '@/actions/personality-actions';
import PersonalitiesClient from './PersonalitiesClient';

export default async function PersonalitiesPage() {
  const rows = await prisma.personalityType.findMany({
    orderBy: { id: 'asc' },
  });

  const personalities: PersonalityData[] = rows.map(p => ({
    id: p.id,
    type: p.personality_key,
    name: p.personality_name,
    description: p.personality_desc ?? '',
    emoji: p.emoji ?? '',
    stars: p.stars,
    status: p.status as 'active' | 'draft',
    accentColor: p.accent_color ?? undefined,
    threshold: p.score_threshold,
  }));

  return (
    <PersonalitiesClient
      initialData={personalities}
      personalitiesCount={personalities.length}
    />
  );
}
