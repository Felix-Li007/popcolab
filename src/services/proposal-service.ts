import 'server-only';

import { ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { logger } from '@/utils/logging-util';
import { type RequestQueueJob } from '@/types/queue-job';

export async function createFittedProposal(job: RequestQueueJob) {
  const request = await prisma.request.findUnique({
    where: { id: job.requestId },
    select: {
      id: true,
      budget_min: true,
      budget_max: true,
      duration_max: true,
      request_status: true,
      proposals: {
        where: {
          proposal_status: {
            in: [ProposalStatus.pending, ProposalStatus.accepted],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error(`Request ${job.requestId} not found.`);
  }

  if (request.proposals.length > 0) {
    if (request.request_status !== REQUEST_STATUS.MATCHED) {
      await prisma.request.update({
        where: { id: request.id },
        data: {
          request_status: REQUEST_STATUS.MATCHED,
        },
      });
    }

    return {
      created: false,
      reason: 'active_proposal_exists',
      proposalId: request.proposals[0]?.id ?? null,
    };
  }

  const candidate = await prisma.experience.findFirst({
    where: {
      duration_max:
        request.duration_max !== null
          ? { lte: request.duration_max }
          : undefined,
    },
    orderBy: [
      { popularity_index: 'desc' },
      { duration_max: 'asc' },
      { id: 'asc' },
    ],
    select: {
      id: true,
      experience_title: true,
    },
  });

  const fallbackCandidate =
    candidate ??
    (await prisma.experience.findFirst({
      orderBy: [{ popularity_index: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        experience_title: true,
      },
    }));

  if (!fallbackCandidate) {
    throw new Error('No experience is available to generate a proposal.');
  }

  const createdProposal = await prisma.$transaction(async tx => {
    const proposal = await tx.proposal.create({
      data: {
        request_id: request.id,
        experience_id: fallbackCandidate.id,
        proposal_status: ProposalStatus.pending,
        objective_alignment: `Generated from ${job.trigger}`,
        base_score: 100,
        risk_adjustment: 0,
        rationale_desc: `Auto-generated for request ${request.id} using experience ${fallbackCandidate.experience_title}.`,
      },
      select: {
        id: true,
      },
    });

    await tx.request.update({
      where: { id: request.id },
      data: {
        request_status: REQUEST_STATUS.MATCHED,
      },
    });

    return proposal;
  });

  logger.info(
    {
      requestId: request.id,
      proposalId: createdProposal.id,
      experienceId: fallbackCandidate.id,
      trigger: job.trigger,
    },
    'Proposal generated from queue job'
  );

  return {
    created: true,
    proposalId: createdProposal.id,
  };
}
