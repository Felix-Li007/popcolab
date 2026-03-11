import 'server-only';

import {
  REQUEST_STATUS,
  getRequestStatusLabel,
  normalizeRequestStatus,
} from '@/constants/request-status';
import { Prisma } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import type {
  OverviewGrowthMetrics,
  OverviewGrowthPoint,
  OverviewRequestStatusPoint,
  OverviewRequestTrendPoint,
} from '@/types/overview-type';

type OverviewCountRow = {
  total_users: number | string | bigint;
  total_teams: number | string | bigint;
  total_requests: number | string | bigint;
};

type OverviewGrowthRow = {
  day_start: Date | string;
  user_count: number | string | bigint;
  team_count: number | string | bigint;
};

type OverviewRequestStatusRow = {
  request_status: string | null;
  count: number | string | bigint;
};

type OverviewRequestTrendRow = {
  month_start: Date | string;
  request_status: string | null;
  count: number | string | bigint;
};

function toNumber(value: number | string | bigint | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toMonthLabel(value: Date | string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

function toMonthKey(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 7);
}

function toDayLabel(value: Date | string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function toDayKey(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export async function getOverviewGrowthMetrics(): Promise<OverviewGrowthMetrics> {
  const [countRows, growthRows, requestStatusRows, requestTrendRows] =
    await Promise.all([
      prisma.$queryRaw<OverviewCountRow[]>(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::int FROM "user") AS total_users,
        (SELECT COUNT(*)::int FROM "team") AS total_teams,
        (SELECT COUNT(*)::int FROM "request") AS total_requests
    `),
      prisma.$queryRaw<OverviewGrowthRow[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '13 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day_start
      ),
      user_counts AS (
        SELECT
          created_at::date AS day_start,
          COUNT(*)::int AS user_count
        FROM "user"
        WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY 1
      ),
      team_counts AS (
        SELECT
          created_at::date AS day_start,
          COUNT(*)::int AS team_count
        FROM "team"
        WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY 1
      )
      SELECT
        days.day_start,
        COALESCE(user_counts.user_count, 0)::int AS user_count,
        COALESCE(team_counts.team_count, 0)::int AS team_count
      FROM days
      LEFT JOIN user_counts ON user_counts.day_start = days.day_start
      LEFT JOIN team_counts ON team_counts.day_start = days.day_start
      ORDER BY days.day_start ASC
    `),
      prisma.$queryRaw<OverviewRequestStatusRow[]>(Prisma.sql`
      SELECT
        request_status::text AS request_status,
        COUNT(*)::int AS count
      FROM "request"
      GROUP BY request_status::text
      ORDER BY COUNT(*) DESC, request_status ASC
    `),
      prisma.$queryRaw<OverviewRequestTrendRow[]>(Prisma.sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
          date_trunc('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS month_start
      ),
      statuses AS (
        SELECT unnest(ARRAY[
          ${REQUEST_STATUS.OPENED}::text,
          ${REQUEST_STATUS.PENDING}::text,
          ${REQUEST_STATUS.MATCHED}::text,
          ${REQUEST_STATUS.CLOSED}::text
        ]) AS request_status
      ),
      request_counts AS (
        SELECT
          date_trunc('month', created_at) AS month_start,
          request_status::text AS request_status,
          COUNT(*)::int AS count
        FROM "request"
        WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY 1, 2
      )
      SELECT
        months.month_start,
        statuses.request_status,
        COALESCE(request_counts.count, 0)::int AS count
      FROM months
      CROSS JOIN statuses
      LEFT JOIN request_counts
        ON request_counts.month_start = months.month_start
        AND request_counts.request_status = statuses.request_status
      ORDER BY months.month_start ASC, statuses.request_status ASC
    `),
    ]);

  const growth: OverviewGrowthPoint[] = growthRows.map(row => ({
    periodKey: toDayKey(row.day_start),
    periodLabel: toDayLabel(row.day_start),
    users: toNumber(row.user_count),
    teams: toNumber(row.team_count),
  }));

  const counts = countRows[0];
  const usersLast14Days = growth.reduce((sum, point) => sum + point.users, 0);
  const teamsLast14Days = growth.reduce((sum, point) => sum + point.teams, 0);
  const requestStatus: OverviewRequestStatusPoint[] = requestStatusRows.map(
    row => ({
      id: normalizeRequestStatus(row.request_status) ?? 'unknown',
      label:
        getRequestStatusLabel(normalizeRequestStatus(row.request_status)) ??
        'Unknown',
      value: toNumber(row.count),
    })
  );
  const requestTrendMap = new Map<string, OverviewRequestTrendPoint>();

  requestTrendRows.forEach(row => {
    const monthKey = toMonthKey(row.month_start);
    const normalizedStatus = normalizeRequestStatus(row.request_status);
    if (!normalizedStatus) return;

    const existing = requestTrendMap.get(monthKey) ?? {
      monthKey,
      monthLabel: toMonthLabel(row.month_start),
      [REQUEST_STATUS.OPENED]: 0,
      [REQUEST_STATUS.PENDING]: 0,
      [REQUEST_STATUS.MATCHED]: 0,
      [REQUEST_STATUS.CLOSED]: 0,
    };

    existing[normalizedStatus] = toNumber(row.count);
    requestTrendMap.set(monthKey, existing);
  });

  const requestTrend = Array.from(requestTrendMap.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  );

  return {
    totalUsers: toNumber(counts?.total_users ?? 0),
    totalTeams: toNumber(counts?.total_teams ?? 0),
    usersLast14Days,
    teamsLast14Days,
    growth,
    totalRequests: toNumber(counts?.total_requests ?? 0),
    requestStatus,
    requestTrend,
  };
}
