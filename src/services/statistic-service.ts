import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import type { BadgeCounts } from '@/types/menu-item';
import { prisma } from '@/libs/prisma-client';

export async function getBadgeCounts(): Promise<BadgeCounts> {
  noStore();

  const [
    personalities,
    questions,
    categories,
    providers,
    experiences,
    dimensions,
    dimensionCategories,
    orders,
    payments,
    teams,
    userRows,
  ] = await Promise.all([
    prisma.personalityType.count(),
    prisma.question.count(),
    prisma.category.count(),
    prisma.provider.count(),
    prisma.experience.count(),
    prisma.dimensionIndex.count(),
    prisma.dimensionCategory.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.team.count(),
    prisma.$queryRaw<{ count: number | string | bigint }[]>`
        SELECT COUNT(*)::int AS count FROM "user"
      `,
  ]);

  return {
    personalities,
    questions,
    categories,
    providers,
    experiences,
    dimensions,
    dimensionCategories,
    bookings: orders,
    orders,
    payments,
    teams,
    users: Number(userRows[0]?.count ?? 0),
  };
}
