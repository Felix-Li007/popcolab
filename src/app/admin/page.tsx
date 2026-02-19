import { prisma } from '@/libs/prisma-client';
import { type PersonalityData } from '@/actions/personality-actions';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const [rows, personalitiesCount, personalitiesActiveCount] =
    await Promise.all([
      prisma.personalityType.findMany({ orderBy: { id: 'asc' }, take: 4 }),
      prisma.personalityType.count(),
      prisma.personalityType.count({ where: { status: 'active' } }),
    ]);

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
    <AdminClient
      initialPersonalities={personalities}
      personalitiesCount={personalitiesCount}
      personalitiesActiveCount={personalitiesActiveCount}
    />
  );
}
