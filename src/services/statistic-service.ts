import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import type { BadgeCounts } from '@/types/menu-item';
import { prisma } from '@/libs/prisma-client';

async function getIntakeFormsCount(): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<{ count: number | string | bigint }[]>`
      SELECT COUNT(*)::int AS count FROM "intake_form"
    `;
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function getBadgeCounts(): Promise<BadgeCounts> {
  noStore();

  const [personalities, questions, forms, dimensions, teams, userRows] =
    await Promise.all([
      prisma.personalityType.count(),
      prisma.question.count(),
      getIntakeFormsCount(),
      prisma.dimensionIndex.count(),
      prisma.team.count(),
      prisma.$queryRaw<{ count: number | string | bigint }[]>`
        SELECT COUNT(*)::int AS count FROM "user"
      `,
    ]);

  return {
    personalities,
    questions,
    forms,
    dimensions,
    teams,
    users: Number(userRows[0]?.count ?? 0),
  };
}
