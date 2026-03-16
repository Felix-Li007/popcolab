jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    request: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invitedUser: {
      findUnique: jest.fn(),
    },
    proposal: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/libs/prisma/client', () => ({
  InviteStatus: {
    pending: 'pending',
    accepted: 'accepted',
    rejected: 'rejected',
  },
  ProposalStatus: {
    pending: 'pending',
    accepted: 'accepted',
    rejected: 'rejected',
  },
  RequestStatus: {
    opened: 'opened',
    pending: 'pending',
    matched: 'matched',
    closed: 'closed',
  },
}));

jest.mock('@/libs/qstash-client', () => ({
  getQStashClient: jest.fn(),
  getQStashEndpointUrl: jest.fn(),
}));

jest.mock('@/services/queue-service', () => ({
  enqueueQueueJob: jest.fn(),
}));

import { InviteStatus, ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import {
  enqueueRequestReady,
  handleRejectedProposal,
  handleUserConfirmed,
  scheduleRequestExpiry,
} from '@/services/request-service';
import { enqueueQueueJob } from '@/services/queue-service';
import { REQUEST_QUEUE_TRIGGER } from '@/types/queue-job';

type PrismaMock = {
  request: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  invitedUser: {
    findUnique: jest.Mock;
  };
  proposal: {
    update: jest.Mock;
  };
};

const prismaMock = prisma as unknown as PrismaMock;
const enqueueQueueJobMock = enqueueQueueJob as jest.MockedFunction<
  typeof enqueueQueueJob
>;
const getQStashClientMock = getQStashClient as jest.MockedFunction<
  typeof getQStashClient
>;
const getQStashEndpointUrlMock = getQStashEndpointUrl as jest.MockedFunction<
  typeof getQStashEndpointUrl
>;

describe('request-service', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T12:00:00.000Z'));
    getQStashEndpointUrlMock.mockReturnValue('https://example.com/api/qstash');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('scheduleRequestExpiry', () => {
    test('publishes a delayed qstash task when request has expired_at', async () => {
      const publishJSON = jest.fn().mockResolvedValue({ messageId: 'msg-1' });
      const expiredAt = new Date('2026-03-10T15:30:00.000Z');

      prismaMock.request.findUnique.mockResolvedValue({
        id: 10,
        expired_at: expiredAt,
      });
      getQStashClientMock.mockReturnValue({
        publishJSON,
      } as never);

      const result = await scheduleRequestExpiry(10);

      expect(result).toEqual({ messageId: 'msg-1' });
      expect(publishJSON).toHaveBeenCalledWith({
        url: 'https://example.com/api/qstash',
        body: {
          type: 'request.proposal.enqueue-if-ready',
          requestId: 10,
          trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
        },
        notBefore: Math.floor(expiredAt.getTime() / 1000),
        deduplicationId: `request-expiry:10:${expiredAt.toISOString()}`,
        retries: 3,
      });
    });

    test('returns a skip result when request is missing expired_at', async () => {
      prismaMock.request.findUnique.mockResolvedValue({
        id: 10,
        expired_at: null,
      });

      await expect(scheduleRequestExpiry(10)).resolves.toEqual({
        scheduled: false,
        reason: 'missing_expired_at',
      });
    });

    test('throws when request does not exist', async () => {
      prismaMock.request.findUnique.mockResolvedValue(null);

      await expect(scheduleRequestExpiry(999)).rejects.toThrow(
        'Request 999 not found.'
      );
    });
  });

  describe('handleUserConfirmed', () => {
    test('enqueues when the invited user belongs to a request ready for queueing', async () => {
      prismaMock.invitedUser.findUnique.mockResolvedValue({ request_id: 7 });
      prismaMock.request.findUnique.mockResolvedValue({
        id: 7,
        expired_at: null,
        request_status: REQUEST_STATUS.OPENED,
        invited_users: [
          { invited_status: InviteStatus.accepted },
          { invited_status: InviteStatus.rejected },
        ],
        proposals: [],
      });
      prismaMock.request.update.mockResolvedValue({ id: 7 });
      enqueueQueueJobMock.mockResolvedValue({
        messageId: 42,
        queueName: 'default_queue',
      });

      const result = await handleUserConfirmed(3);

      expect(result).toEqual({
        queued: true,
        queueMessageId: 42,
        queueName: 'default_queue',
      });
      expect(enqueueQueueJobMock).toHaveBeenCalledWith({
        requestId: 7,
        trigger: REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED,
        rejectedProposalId: undefined,
        queuedAt: expect.any(String),
      });
    });

    test('throws when invited user does not exist', async () => {
      prismaMock.invitedUser.findUnique.mockResolvedValue(null);

      await expect(handleUserConfirmed(12)).rejects.toThrow(
        'Invited user 12 not found.'
      );
    });
  });

  describe('handleRejectedProposal', () => {
    test('marks proposal rejected and re-enqueues the request', async () => {
      prismaMock.proposal.update.mockResolvedValue({
        id: 5,
        request_id: 11,
      });
      prismaMock.request.findUnique.mockResolvedValue({
        id: 11,
        expired_at: null,
        request_status: REQUEST_STATUS.MATCHED,
        invited_users: [],
        proposals: [{ id: 5 }],
      });
      prismaMock.request.update.mockResolvedValue({ id: 11 });
      enqueueQueueJobMock.mockResolvedValue({
        messageId: 77,
        queueName: 'default_queue',
      });

      const result = await handleRejectedProposal(5);

      expect(prismaMock.proposal.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          proposal_status: ProposalStatus.rejected,
        },
        select: {
          id: true,
          request_id: true,
        },
      });
      expect(result).toEqual({
        queued: true,
        queueMessageId: 77,
        queueName: 'default_queue',
      });
      expect(enqueueQueueJobMock).toHaveBeenCalledWith({
        requestId: 11,
        trigger: REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED,
        rejectedProposalId: 5,
        queuedAt: expect.any(String),
      });
    });
  });

  describe('enqueueRequestReady', () => {
    test('skips queueing when an active proposal already exists for non-rejected triggers', async () => {
      prismaMock.request.findUnique.mockResolvedValue({
        id: 20,
        expired_at: null,
        request_status: REQUEST_STATUS.OPENED,
        invited_users: [],
        proposals: [{ id: 1 }],
      });

      await expect(
        enqueueRequestReady(20, REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED)
      ).resolves.toEqual({
        queued: false,
        reason: 'active_proposal_exists',
      });

      expect(prismaMock.request.update).not.toHaveBeenCalled();
      expect(enqueueQueueJobMock).not.toHaveBeenCalled();
    });

    test('skips queueing when a request is closed', async () => {
      prismaMock.request.findUnique.mockResolvedValue({
        id: 21,
        expired_at: new Date('2026-03-09T11:59:00.000Z'),
        request_status: REQUEST_STATUS.CLOSED,
        invited_users: [],
        proposals: [],
      });

      await expect(
        enqueueRequestReady(21, REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED)
      ).resolves.toEqual({
        queued: false,
        reason: 'request_closed',
      });
    });

    test('skips queueing when request is not ready for the trigger', async () => {
      prismaMock.request.findUnique.mockResolvedValue({
        id: 22,
        expired_at: new Date('2026-03-09T12:10:00.000Z'),
        request_status: REQUEST_STATUS.OPENED,
        invited_users: [{ invited_status: InviteStatus.pending }],
        proposals: [],
      });

      await expect(
        enqueueRequestReady(22, REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED)
      ).resolves.toEqual({
        queued: false,
        reason: 'request_not_ready',
      });
    });

    test('queues when all invited users have responded', async () => {
      prismaMock.request.findUnique.mockResolvedValue({
        id: 23,
        expired_at: null,
        request_status: REQUEST_STATUS.OPENED,
        invited_users: [
          { invited_status: InviteStatus.accepted },
          { invited_status: InviteStatus.rejected },
        ],
        proposals: [],
      });
      prismaMock.request.update.mockResolvedValue({ id: 23 });
      enqueueQueueJobMock.mockResolvedValue({
        messageId: 88,
        queueName: 'proposal_generation',
      });

      await expect(
        enqueueRequestReady(23, REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED)
      ).resolves.toEqual({
        queued: true,
        queueMessageId: 88,
        queueName: 'proposal_generation',
      });

      expect(prismaMock.request.update).toHaveBeenCalledWith({
        where: { id: 23 },
        data: {
          request_status: REQUEST_STATUS.PENDING,
        },
      });
    });
  });
});
