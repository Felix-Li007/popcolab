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

export type OverviewBreakdownItem = {
  label: string;
  value: number;
};

export type OverviewExperienceTrendPoint = {
  periodKey: string;
  periodLabel: string;
  value: number;
};

export type OverviewEventSummaryItem = {
  id: number;
  title: string;
  location: string;
  dateLabel: string;
  status: 'live' | 'upcoming';
};

export type OverviewEventMetrics = {
  highlightedEvents: OverviewEventSummaryItem[];
};

export type OverviewQuizTrendPoint = {
  periodKey: string;
  periodLabel: string;
  value: number;
};

export type OverviewQuizMetrics = {
  totalCompletions: number;
  uniqueParticipants: number;
  completionsThisWeek: number;
  completionsPreviousWeek: number;
  weeklyChangePct: number;
  trend: OverviewQuizTrendPoint[];
};

export type OverviewQuestionMetrics = {
  totalQuestions: number;
  mappedQuestions: number;
  unmappedQuestions: number;
  choiceQuestionsWithoutOptions: number;
  byForm: OverviewBreakdownItem[];
  byType: OverviewBreakdownItem[];
};

export type OverviewExperienceMetrics = {
  totalExperiences: number;
  activeExperiences: number;
  draftExperiences: number;
  inactiveExperiences: number;
  newExperiencesThisWeek: number;
  statusBreakdown: OverviewBreakdownItem[];
  newExperienceTrend: OverviewExperienceTrendPoint[];
  deliveryMethodBreakdown: OverviewBreakdownItem[];
  topCategories: OverviewBreakdownItem[];
};

export type OverviewRequestMetrics = {
  matchRate: number;
  backlogRequests: number;
  averageMatchTimeHours: number;
  topRequestedCategories: OverviewBreakdownItem[];
  topMatchedExperiences: OverviewBreakdownItem[];
};

export type OverviewProposalMetrics = {
  totalProposals: number;
  pendingProposals: number;
  approvedProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  acceptanceRate: number;
  averageExperiencesPerProposal: number;
  statusBreakdown: OverviewBreakdownItem[];
  trend: OverviewExperienceTrendPoint[];
  topProposedExperiences: OverviewBreakdownItem[];
};

export type OverviewUserTeamMetrics = {
  onboardingCompletedUsers: number;
  onboardingCompletionRate: number;
  usersInTeams: number;
  soloUsers: number;
  averageTeamSize: number;
  teamsWithMultipleMembers: number;
  totalInvites: number;
  pendingInvites: number;
  acceptedInvites: number;
  rejectedInvites: number;
  inviteAcceptanceRate: number;
};

export type OverviewGrowthMetrics = {
  totalUsers: number;
  totalTeams: number;
  usersLast14Days: number;
  teamsLast14Days: number;
  growth: OverviewGrowthPoint[];
  userTeamMetrics: OverviewUserTeamMetrics;
  totalRequests: number;
  requestStatus: OverviewRequestStatusPoint[];
  requestTrend: OverviewRequestTrendPoint[];
  requestMetrics: OverviewRequestMetrics;
  proposalMetrics: OverviewProposalMetrics;
  experienceMetrics: OverviewExperienceMetrics;
  eventMetrics: OverviewEventMetrics;
  quizMetrics: OverviewQuizMetrics;
  questionMetrics: OverviewQuestionMetrics;
};
