import 'server-only';

import { prisma } from '@/libs/prisma-client';
import { ProposalStatus } from '@/libs/prisma/client';

export type UserProposalItem = {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  experienceTitle: string;
  deliveryMethod: string;
  capacityMax: number;
  rationale: string;
  objectiveCategory: string;
  createdAt: Date;
};

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
      rationale_desc: true,
      created_at: true,
      experience: {
        select: {
          experience_title: true,
          delivery_methods: true,
          capacity_max: true,
        },
      },
      request: {
        select: {
          objective_category: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return proposals.map(p => ({
    id: p.id,
    status: p.proposal_status as 'pending' | 'accepted' | 'rejected',
    experienceTitle: p.experience.experience_title,
    deliveryMethod: p.experience.delivery_methods,
    capacityMax: p.experience.capacity_max,
    rationale: p.rationale_desc,
    objectiveCategory: p.request.objective_category,
    createdAt: p.created_at,
  }));
}

export async function getPendingProposalCount(userId: number): Promise<number> {
  return prisma.proposal.count({
    where: {
      request: { user_id: userId },
      proposal_status: ProposalStatus.pending,
    },
  });
}
