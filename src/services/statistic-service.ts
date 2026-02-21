import 'server-only';
import type { BadgeCounts } from '@/types/navmenu-type';
import { prisma } from '@/libs/prisma-client';

export async function getBadgeCounts(): Promise<BadgeCounts> {
  const [personalities, questions] = await Promise.all([
    prisma.personalityType.count(),
    prisma.question.count(),
  ]);

  return { personalities, questions };
}
