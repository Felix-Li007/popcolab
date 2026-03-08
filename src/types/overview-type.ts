import type { RequestStatus } from '@/constants/request-status';

export type OverviewGrowthPoint = {
  monthKey: string;
  monthLabel: string;
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
  usersThisMonth: number;
  teamsThisMonth: number;
  growth: OverviewGrowthPoint[];
  totalRequests: number;
  requestStatus: OverviewRequestStatusPoint[];
  requestTrend: OverviewRequestTrendPoint[];
};
