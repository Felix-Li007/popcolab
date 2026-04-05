import 'server-only';

import { prisma } from '@/libs/prisma-client';
import { ProposalStatus } from '@/libs/prisma/client';

export type UserProposalItem = {
  id: number;
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
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
    status: String(p.proposal_status).toLowerCase() as
      | 'pending'
      | 'approved'
      | 'accepted'
      | 'rejected',
    experienceTitle:
      p.proposal_experiences[0]?.experience.experience_title ?? '-',
    deliveryMethod:
      p.proposal_experiences[0]?.experience.delivery_methods ?? '-',
    capacityMax: p.proposal_experiences[0]?.experience.capacity_max ?? 0,
    rationale: p.proposal_experiences[0]?.rationale_desc ?? '-',
    objectiveCategory: p.request.objective_category,
    createdAt: p.created_at,
  }));
}

export async function getPendingProposalCount(userId: number): Promise<number> {
  return prisma.proposal.count({
    where: {
      request: { user_id: userId },
      proposal_status: ProposalStatus.PENDING,
    },
  });
}
