import 'server-only';

import { InviteStatus, ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { enqueueQueueJob } from '@/services/queue-service';
import { REQUEST_QUEUE_TRIGGER, RequestQueueTrigger } from '@/types/queue-job';
import { QSTASH_TASK_TYPE } from '@/types/qstash-task';

/**
 * When a request expires, schedules a QStash task to enqueue a proposal.
 * @param requestId
 * @returns
 */
export async function scheduleRequestExpiry(requestId: number) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      expired_at: true,
    },
  });

  if (!request) {
    throw new Error(`Request ${requestId} not found.`);
  }

  if (!request.expired_at) {
    return { scheduled: false, reason: 'missing_expired_at' } as const;
  }

  return getQStashClient().publishJSON({
    url: getQStashEndpointUrl(),
    body: {
      type: QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY,
      requestId,
      trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
    },
    notBefore: Math.floor(request.expired_at.getTime() / 1000),
    deduplicationId: `request-expiry:${requestId}:${request.expired_at.toISOString()}`,
    retries: 3,
  });
}

export async function handleUserConfirmed(userId: number) {
  const user = await prisma.invitedUser.findUnique({
    where: { id: userId },
    select: {
      request_id: true,
    },
  });

  if (!user) {
    throw new Error(`Invited user ${userId} not found.`);
  }

  return enqueueRequestReady(
    user.request_id,
    REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED
  );
}

export async function handleRejectedProposal(proposalId: number) {
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      proposal_status: ProposalStatus.rejected,
    },
    select: {
      id: true,
      request_id: true,
    },
  });

  await prisma.request.update({
    where: { id: proposal.request_id },
    data: {
      request_status: REQUEST_STATUS.PENDING,
    },
  });

  return enqueueRequestReady(
    proposal.request_id,
    REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED,
    proposal.id
  );
}

export async function enqueueRequestReady(
  requestId: number,
  trigger: RequestQueueTrigger,
  rejectedProposalId?: number
) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      expired_at: true,
      request_status: true,
      invited_users: {
        select: {
          invited_status: true,
        },
      },
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
    throw new Error(`Request ${requestId} not found.`);
  }

  if (
    request.proposals.length > 0 &&
    trigger !== REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED
  ) {
    return { queued: false, reason: 'active_proposal_exists' } as const;
  }

  if (request.request_status === REQUEST_STATUS.CLOSED) {
    return { queued: false, reason: 'request_closed' } as const;
  }

  const now = new Date();
  const allInvitedAccepted =
    request.invited_users.length > 0 &&
    request.invited_users.every(
      invite => invite.invited_status !== InviteStatus.pending
    );
  const expired =
    request.expired_at !== null &&
    request.expired_at.getTime() <= now.getTime();

  const ready =
    trigger === REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED ||
    (trigger === REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED &&
      allInvitedAccepted) ||
    (trigger === REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED && expired);

  if (!ready) {
    return { queued: false, reason: 'request_not_ready' } as const;
  }

  await prisma.request.update({
    where: { id: request.id },
    data: {
      request_status: REQUEST_STATUS.PENDING,
    },
  });

  const result = await enqueueQueueJob({
    requestId: request.id,
    trigger,
    rejectedProposalId,
    queuedAt: new Date().toISOString(),
  });

  return {
    queued: true,
    queueMessageId: result.messageId,
    queueName: result.queueName,
  } as const;
}
