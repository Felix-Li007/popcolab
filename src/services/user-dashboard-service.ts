import 'server-only';
import { prisma } from '@/libs/prisma-client';
import { getTestResult } from '@/services/response-service';
import type { Personality } from '@/types/personality-type';

export type UserTeamSummary = {
  id: number;
  name: string;
  memberCount: number;
  role: 'owner' | 'member';
};

export type UserRequestSummary = {
  id: number;
  status: string;
  createdAt: Date | null;
};

export type UserDashboardData = {
  personality: Personality | null;
  totalScore: number | null;
  teams: UserTeamSummary[];
  requests: UserRequestSummary[];
};

export async function getUserDashboardData(
  clerkId: string
): Promise<UserDashboardData> {
  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: {
      id: true,
      created_teams: {
        select: {
          id: true,
          team_name: true,
          _count: { select: { team_mates: true } },
        },
        take: 6,
      },
      team_mates: {
        select: {
          team: {
            select: {
              id: true,
              team_name: true,
              _count: { select: { team_mates: true } },
            },
          },
        },
        take: 6,
      },
      requests: {
        select: {
          id: true,
          request_status: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) {
    return { personality: null, totalScore: null, teams: [], requests: [] };
  }

  const testResult = await getTestResult(user.id);

  const seenIds = new Set<number>();
  const teams: UserTeamSummary[] = [];

  for (const t of user.created_teams) {
    if (!seenIds.has(t.id)) {
      seenIds.add(t.id);
      teams.push({
        id: t.id,
        name: t.team_name,
        memberCount: t._count.team_mates,
        role: 'owner',
      });
    }
  }

  for (const tm of user.team_mates) {
    if (!seenIds.has(tm.team.id)) {
      seenIds.add(tm.team.id);
      teams.push({
        id: tm.team.id,
        name: tm.team.team_name,
        memberCount: tm.team._count.team_mates,
        role: 'member',
      });
    }
  }

  const requests: UserRequestSummary[] = user.requests.map(r => ({
    id: r.id,
    status: r.request_status,
    createdAt: r.created_at,
  }));

  return {
    personality: testResult?.personality ?? null,
    totalScore: testResult?.totalScore ?? null,
    teams,
    requests,
  };
}
