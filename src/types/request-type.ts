import type { RequestStatus } from '@/constants/request-status';

export type AdminRequestStatusFilter = 'all' | RequestStatus;

export type AdminRequestUserSummary = {
  id: number;
  email: string;
  userName: string | null;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  departmentName: string | null;
  roleTitle: string | null;
};

export type AdminRequestInviteItem = {
  id: number;
  invitedStatus: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  respondAt: string | null;
  expiredAt: string | null;
};

export type AdminRequestProposalItem = {
  id: number;
  status: string;
  experienceTitle: string;
  rationale: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminRequestScheduleItem = {
  date: string;
  startTime: string | null;
  endTime: string | null;
};

export type AdminRequestPreferenceItem = {
  id: number;
  questionId: number;
  questionText: string | null;
  dimensionId: number | null;
  dimensionName: string | null;
  categoryName: string | null;
  optionId: number | null;
  optionLabel: string | null;
  optionValue: string | null;
  desiredValue: string;
  weightRate: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminRequestListItem = {
  id: number;
  status: RequestStatus;
  objectiveCategory: string;
  deliveryMethod: string;
  durationMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  participantCount: number | null;
  capacityMax: number;
  constraintMode: string;
  preferredDate: string | null;
  preferredDateTimes: AdminRequestScheduleItem[];
  deadlineDate: string | null;
  expiredAt: string | null;
  notesForAdmin: string | null;
  createdAt: string;
  updatedAt: string;
  user: AdminRequestUserSummary;
  inviteSummary: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  proposalSummary: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  requestPreferences: AdminRequestPreferenceItem[];
  invitedUsers: AdminRequestInviteItem[];
  proposals: AdminRequestProposalItem[];
};

export type AdminRequestStatusCounts = Record<RequestStatus, number>;

export type AdminRequestsPageData = {
  items: AdminRequestListItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  statusCounts: AdminRequestStatusCounts;
};

export type AdminRequestsPageQuery = {
  search: string;
  userEmail: string;
  companyName: string;
  status: AdminRequestStatusFilter;
  userId: number | null;
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize: number;
};
