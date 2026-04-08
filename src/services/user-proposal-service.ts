import 'server-only';

import { prisma } from '@/libs/prisma-client';
import { ProposalStatus } from '@/libs/prisma/client';

export type UserProposalItem = {
  id: number;
  requestId: number;
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
  experienceTitle: string;
  deliveryMethod: string;
  capacityMax: number;
  rationale: string;
  objectiveCategory: string;
  experienceCount: number;
  createdAt: Date;
};

export type UserProposalExperienceDetail = {
  id: number;
  title: string;
  deliveryMethods: string;
  capacityMax: number;
  durationMin: number;
  durationMax: number;
  startingPrice: number | null;
  addingPrice: number | null;
  rationale: string;
  baseScore: number;
  riskAdjustment: number;
};

export type UserProposalDetail = {
  id: number;
  requestId: number;
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
  objectiveAlignment: string;
  createdAt: Date;
  updatedAt: Date;
  request: {
    id: number;
    objectiveCategory: string;
    budgetMin: number | null;
    budgetMax: number | null;
    preferredDate: Date | null;
    participantCount: number | null;
  };
  experiences: UserProposalExperienceDetail[];
};

function toStatus(
  raw: ProposalStatus
): 'pending' | 'approved' | 'accepted' | 'rejected' {
  return String(raw).toLowerCase() as
    | 'pending'
    | 'approved'
    | 'accepted'
    | 'rejected';
}

export async function getUserProposals(
  userId: number
): Promise<UserProposalItem[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      request: { user_id: userId },
    },
    select: {
      id: true,
      proposal_status: true,
      created_at: true,
      proposal_experiences: {
        include: {
          experience: {
            select: {
              experience_title: true,
              delivery_methods: true,
              capacity_max: true,
            },
          },
        },
        orderBy: [{ id: 'asc' }],
        take: 1,
      },
      _count: {
        select: { proposal_experiences: true },
      },
      request: {
        select: {
          id: true,
          objective_category: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return proposals.map(p => ({
    id: p.id,
    requestId: p.request.id,
    status: toStatus(p.proposal_status),
    experienceTitle:
      p.proposal_experiences[0]?.experience.experience_title ?? '-',
    deliveryMethod:
      p.proposal_experiences[0]?.experience.delivery_methods ?? '-',
    capacityMax: p.proposal_experiences[0]?.experience.capacity_max ?? 0,
    rationale: p.proposal_experiences[0]?.rationale_desc ?? '-',
    objectiveCategory: p.request.objective_category,
    experienceCount: p._count.proposal_experiences,
    createdAt: p.created_at,
  }));
}

export async function getUserProposalById(
  proposalId: number,
  userId: number
): Promise<UserProposalDetail | null> {
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      request: { user_id: userId },
    },
    select: {
      id: true,
      proposal_status: true,
      objective_alignment: true,
      created_at: true,
      updated_at: true,
      request: {
        select: {
          id: true,
          objective_category: true,
          budget_min: true,
          budget_max: true,
          preferred_date: true,
          participant_count: true,
        },
      },
      proposal_experiences: {
        orderBy: { id: 'asc' },
        select: {
          rationale_desc: true,
          base_score: true,
          risk_adjustment: true,
          experience: {
            select: {
              id: true,
              experience_title: true,
              delivery_methods: true,
              capacity_max: true,
              duration_min: true,
              duration_max: true,
              experience_pricing: {
                select: {
                  starting_price: true,
                  adding_price: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!proposal) return null;

  return {
    id: proposal.id,
    requestId: proposal.request.id,
    status: toStatus(proposal.proposal_status),
    objectiveAlignment: proposal.objective_alignment,
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at,
    request: {
      id: proposal.request.id,
      objectiveCategory: proposal.request.objective_category,
      budgetMin: proposal.request.budget_min
        ? Number(proposal.request.budget_min)
        : null,
      budgetMax: proposal.request.budget_max
        ? Number(proposal.request.budget_max)
        : null,
      preferredDate: proposal.request.preferred_date,
      participantCount: proposal.request.participant_count,
    },
    experiences: proposal.proposal_experiences.map(pe => ({
      id: pe.experience.id,
      title: pe.experience.experience_title,
      deliveryMethods: pe.experience.delivery_methods,
      capacityMax: pe.experience.capacity_max,
      durationMin: pe.experience.duration_min,
      durationMax: pe.experience.duration_max,
      startingPrice: pe.experience.experience_pricing?.starting_price
        ? Number(pe.experience.experience_pricing.starting_price)
        : null,
      addingPrice: pe.experience.experience_pricing?.adding_price
        ? Number(pe.experience.experience_pricing.adding_price)
        : null,
      rationale: pe.rationale_desc,
      baseScore: Number(pe.base_score),
      riskAdjustment: Number(pe.risk_adjustment),
    })),
  };
}

export async function getPendingProposalCount(userId: number): Promise<number> {
  return prisma.proposal.count({
    where: {
      request: { user_id: userId },
      proposal_status: ProposalStatus.PENDING,
    },
  });
}
