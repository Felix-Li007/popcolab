import type { RequestStatus } from '@/constants/request-status';

export type AdminProposalStatusFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'accepted'
  | 'rejected';

export type AdminProposalUserSummary = {
  id: number;
  email: string;
  displayName: string;
  companyName: string | null;
};

export type AdminProposalExperienceItem = {
  id: number;
  title: string;
  rationale: string;
  baseScore: number;
  riskAdjustment: number;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  deliveryMethods: string;
  leadType: string;
  startingPrice: number | null;
  addingPrice: number | null;
  pricingModel: string | null;
  pricingNotes: string | null;
  dietaryConsiderations: string | null;
  nextScheduleDate: string | null;
  coverImageUrl: string | null;
};

export type AdminProposalListItem = {
  id: number;
  requestId: number;
  requestStatus: RequestStatus;
  requestBudgetMin: number | null;
  requestBudgetMax: number | null;
  requestExpiredAt: string | null;
  requestPreferenceCount: number;
  requestProposalCount: number;
  experienceId: number;
  experienceTitle: string;
  experiences: AdminProposalExperienceItem[];
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
  objectiveAlignment: string;
  rejectNotes: string | null;
  rationale: string;
  baseScore: number;
  riskAdjustment: number;
  createdAt: string;
  updatedAt: string;
  user: AdminProposalUserSummary;
};

export type AdminProposalEditableItem = AdminProposalListItem;

export type AdminProposalStatusCounts = Record<
  Exclude<AdminProposalStatusFilter, 'all'>,
  number
>;

export type AdminProposalsPageData = {
  items: AdminProposalListItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  statusCounts: AdminProposalStatusCounts;
};

export type AdminProposalsPageQuery = {
  search: string;
  userEmail: string;
  companyName: string;
  status: AdminProposalStatusFilter;
  requestId: number | null;
  page: number;
  pageSize: number;
};

export type AdminProposalEditableUpdateInput = {
  status: Exclude<AdminProposalStatusFilter, 'all'>;
  objectiveAlignment: string;
  rationale: string;
  baseScore: number;
  riskAdjustment: number;
};

export type AdminProposalEditableUpdateErrors = Partial<
  Record<keyof AdminProposalEditableUpdateInput | '_form', string>
>;

export type ProposalEditState = {
  success?: boolean;
  error?: string;
  fieldErrors?: AdminProposalEditableUpdateErrors;
};
