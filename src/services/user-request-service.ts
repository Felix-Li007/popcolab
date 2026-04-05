import 'server-only';

import { prisma } from '@/libs/prisma-client';
import { ProposalStatus } from '@/libs/prisma/client';

export type UserRequestProposal = {
  id: number;
  rationale: string;
  experienceTitle: string;
  deliveryMethod: string;
  capacityMax: number;
};

export type UserRequestItem = {
  id: number;
  status: 'opened' | 'pending' | 'matched' | 'closed';
  objectiveCategory: string;
  preferredDate: Date | null;
  participantCount: number | null;
  createdAt: Date;
  proposal: UserRequestProposal | null;
};

export type RequestStats = {
  total: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
};

export async function getUserRequests(
  userId: number
): Promise<UserRequestItem[]> {
  const requests = await prisma.request.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      request_status: true,
      objective_category: true,
      preferred_date: true,
      participant_count: true,
      created_at: true,
      proposals: {
        where: { proposal_status: ProposalStatus.PENDING },
        include: {
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
        },
        take: 1,
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return requests.map(r => ({
    id: r.id,
    status: r.request_status as UserRequestItem['status'],
    objectiveCategory: r.objective_category,
    preferredDate: r.preferred_date,
    participantCount: r.participant_count,
    createdAt: r.created_at,
    proposal: r.proposals[0]
      ? {
          id: r.proposals[0].id,
          rationale:
            r.proposals[0].proposal_experiences[0]?.rationale_desc ?? '-',
          experienceTitle:
            r.proposals[0].proposal_experiences[0]?.experience
              .experience_title ?? '-',
          deliveryMethod:
            r.proposals[0].proposal_experiences[0]?.experience
              .delivery_methods ?? '-',
          capacityMax:
            r.proposals[0].proposal_experiences[0]?.experience.capacity_max ??
            0,
        }
      : null,
  }));
}

export async function getRequestStats(userId: number): Promise<RequestStats> {
  const counts = await prisma.request.groupBy({
    by: ['request_status'],
    where: { user_id: userId },
    _count: { id: true },
  });

  const map = Object.fromEntries(
    counts.map(c => [c.request_status, c._count.id])
  );

  return {
    total: Object.values(map).reduce((a, b) => a + b, 0),
    submitted: map['opened'] ?? 0,
    underReview: map['pending'] ?? 0,
    approved: map['matched'] ?? 0,
    rejected: map['closed'] ?? 0,
  };
}

export async function createRequest(params: {
  userId: number;
  eventTypes: string[];
  durationMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredDate: Date | null;
  participantCount: number;
  notesForAdmin: string | null;
}): Promise<number> {
  const objectiveCategory = params.eventTypes.join(', ').slice(0, 100);

  const request = await prisma.request.create({
    data: {
      user_id: params.userId,
      objective_category: objectiveCategory,
      request_status: 'opened',
      delivery_method: 'in_person',
      duration_max: params.durationMax,
      preferred_date: params.preferredDate,
      participant_count: params.participantCount,
      budget_min: params.budgetMin,
      budget_max: params.budgetMax,
      notes_for_admin: params.notesForAdmin,
    },
    select: { id: true },
  });

  return request.id;
}
