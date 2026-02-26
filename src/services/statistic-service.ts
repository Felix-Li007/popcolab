import 'server-only';
import type { BadgeCounts } from '@/types/menu-item';
import { prisma } from '@/libs/prisma-client';

export async function getBadgeCounts(): Promise<BadgeCounts> {
  const [personalities, questions, dimensions] = await Promise.all([
    prisma.personalityType.count(),
    prisma.question.count(),
    prisma.dimensionIndex.count(),
  ]);

  return { personalities, questions, dimensions };
}
