import type { AdminProposalListItem } from '@/types/proposal-type';

export type ProposalExperienceView = {
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

export type ProposalView = {
  id: number;
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
  objectiveAlignment: string;
  rejectNotes: string | null;
  rationale: string;
  baseScore: number;
  riskAdjustment: number;
  createdAt: string;
  updatedAt: string;
  experiences: ProposalExperienceView[];
};

export type RequestGroupView = {
  requestId: number;
  requestStatus: AdminProposalListItem['requestStatus'];
  requestBudgetMin: number | null;
  requestBudgetMax: number | null;
  requestExpiredAt: string | null;
  requestPreferenceCount: number;
  requestProposalCount: number;
  user: AdminProposalListItem['user'];
  proposals: ProposalView[];
};

export type ProposalRowView = {
  request: RequestGroupView;
  proposal: ProposalView;
};
