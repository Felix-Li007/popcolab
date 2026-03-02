import 'server-only';
import type { BadgeCounts } from '@/types/menu-item';
import { prisma } from '@/libs/prisma-client';

export async function getBadgeCounts(): Promise<BadgeCounts> {
  const [personalities, questions, dimensions, teams, userRows] =
    await Promise.all([
      prisma.personalityType.count(),
      prisma.question.count(),
      prisma.dimensionIndex.count(),
      prisma.team.count(),
      prisma.$queryRaw<{ count: number | string | bigint }[]>`
        SELECT COUNT(*)::int AS count FROM "user"
      `,
    ]);

  return {
    personalities,
    questions,
    dimensions,
    teams,
    users: Number(userRows[0]?.count ?? 0),
  };
}
