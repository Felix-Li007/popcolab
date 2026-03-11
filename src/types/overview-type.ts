import type { RequestStatus } from '@/constants/request-status';

export type OverviewGrowthPoint = {
  periodKey: string;
  periodLabel: string;
  users: number;
  teams: number;
};

export type OverviewRequestStatusPoint = {
  id: RequestStatus | 'unknown';
  label: string;
  value: number;
};

export type OverviewRequestTrendPoint = {
  monthKey: string;
  monthLabel: string;
} & Record<RequestStatus, number>;

export type OverviewGrowthMetrics = {
  totalUsers: number;
  totalTeams: number;
  usersLast14Days: number;
  teamsLast14Days: number;
  growth: OverviewGrowthPoint[];
  totalRequests: number;
  requestStatus: OverviewRequestStatusPoint[];
  requestTrend: OverviewRequestTrendPoint[];
};
