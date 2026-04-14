jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    request: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
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
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
  },
  RequestStatus: {
    OPENED: 'OPENED',
    PENDING: 'PENDING',
    MATCHED: 'MATCHED',
    CLOSED: 'CLOSED',
    PROCESSING: 'PROCESSING',
    RETRYING: 'RETRYING',
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
  getAdminRequestsPage,
  enqueueRequestReady,
  handleRejectedProposal,
  handleUserConfirmed,
  scheduleRequestExpiry,
} from '@/services/request-service';
import { enqueueQueueJob } from '@/services/queue-service';
import { REQUEST_QUEUE_TRIGGER } from '@/types/queue-job';

type PrismaMock = {
  request: {
    count: jest.Mock;
    findMany: jest.Mock;
    groupBy: jest.Mock;
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
          proposal_status: ProposalStatus.REJECTED,
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

describe('getAdminRequestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds request filters including status, userId, search, and created date range', async () => {
    prismaMock.request.count.mockResolvedValue(0);
    prismaMock.request.findMany.mockResolvedValue([]);
    prismaMock.request.groupBy.mockResolvedValue([]);

    await getAdminRequestsPage({
      search: 'alex',
      userEmail: 'user@example.com',
      companyName: 'acme',
      status: REQUEST_STATUS.PENDING,
      userId: 12,
      createdFrom: '2026-03-01',
      createdTo: '2026-03-10',
      page: 2,
      pageSize: 5,
    });

    expect(prismaMock.request.count).toHaveBeenCalledTimes(1);
    expect(prismaMock.request.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.request.groupBy).toHaveBeenCalledTimes(1);

    const countArgs = prismaMock.request.count.mock.calls[0][0];
    const findManyArgs = prismaMock.request.findMany.mock.calls[0][0];

    expect(findManyArgs.skip).toBe(5);
    expect(findManyArgs.take).toBe(5);

    const whereFromCount = countArgs.where;
    expect(whereFromCount.AND).toEqual(
      expect.arrayContaining([
        { request_status: REQUEST_STATUS.PENDING },
        { user_id: 12 },
        {
          user: {
            is: {
              email: {
                contains: 'user@example.com',
                mode: 'insensitive',
              },
            },
          },
        },
        {
          user: {
            is: {
              corporate: {
                is: {
                  company_name: {
                    contains: 'acme',
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        },
        {
          created_at: {
            gte: new Date('2026-03-01T00:00:00'),
            lt: new Date('2026-03-11T00:00:00'),
          },
        },
        expect.objectContaining({ OR: expect.any(Array) }),
      ])
    );

    const whereFromFindMany = findManyArgs.where;
    expect(whereFromFindMany).toEqual(whereFromCount);

    const groupByArgs = prismaMock.request.groupBy.mock.calls[0][0];
    const statusWhere = groupByArgs.where;
    expect(statusWhere.AND).toEqual(
      expect.arrayContaining([
        { user_id: 12 },
        {
          user: {
            is: {
              email: {
                contains: 'user@example.com',
                mode: 'insensitive',
              },
            },
          },
        },
        {
          user: {
            is: {
              corporate: {
                is: {
                  company_name: {
                    contains: 'acme',
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        },
        {
          created_at: {
            gte: new Date('2026-03-01T00:00:00'),
            lt: new Date('2026-03-11T00:00:00'),
          },
        },
        expect.objectContaining({ OR: expect.any(Array) }),
      ])
    );

    const hasStatusFilter = (
      statusWhere.AND as Array<Record<string, unknown>>
    ).some(clause => 'request_status' in clause);
    expect(hasStatusFilter).toBe(false);
  });

  it('maps row details and status counts correctly', async () => {
    prismaMock.request.count.mockResolvedValue(1);
    prismaMock.request.findMany.mockResolvedValue([
      {
        id: 77,
        request_status: REQUEST_STATUS.MATCHED,
        objective_category: 'Team Bonding',
        delivery_method: 'in_person',
        duration_max: 4,
        budget_min: { toString: () => '1000' },
        budget_max: { toString: () => '2500' },
        participant_count: 20,
        capacity_max: 30,
        constraint_mode: 'SOFT',
        preferred_date: new Date('2026-03-22T09:00:00.000Z'),
        expired_at: new Date('2026-03-20T09:00:00.000Z'),
        notes_for_admin: 'Need indoor setup',
        created_at: new Date('2026-03-10T08:00:00.000Z'),
        updated_at: new Date('2026-03-11T08:00:00.000Z'),
        user: {
          id: 9,
          email: 'user@example.com',
          user_name: 'user_9',
          profile: {
            first_name: 'Alex',
            last_name: 'Chen',
          },
          corporate: {
            company_name: 'Acme',
            department_name: 'HR',
            role_title: 'Manager',
          },
        },
        invited_users: [
          {
            id: 2,
            invited_status: 'accepted',
            user_name: 'Teammate A',
            user_email: 'a@example.com',
            created_at: new Date('2026-03-10T10:00:00.000Z'),
            respond_at: new Date('2026-03-10T12:00:00.000Z'),
            expired_at: null,
          },
          {
            id: 1,
            invited_status: 'pending',
            user_name: 'Teammate B',
            user_email: 'b@example.com',
            created_at: new Date('2026-03-10T09:00:00.000Z'),
            respond_at: null,
            expired_at: null,
          },
        ],
        proposals: [
          {
            id: 5,
            proposal_status: 'accepted',
            rationale_desc: 'Best fit for your team objective',
            created_at: new Date('2026-03-11T10:00:00.000Z'),
            updated_at: new Date('2026-03-11T11:00:00.000Z'),
            experience: {
              experience_title: 'Creative Workshop',
            },
          },
        ],
      },
    ]);
    prismaMock.request.groupBy.mockResolvedValue([
      { request_status: REQUEST_STATUS.OPENED, _count: { id: 4 } },
      { request_status: REQUEST_STATUS.PENDING, _count: { id: 3 } },
      { request_status: REQUEST_STATUS.MATCHED, _count: { id: 2 } },
      { request_status: REQUEST_STATUS.CLOSED, _count: { id: 1 } },
    ]);

    const result = await getAdminRequestsPage({
      search: '',
      userEmail: '',
      companyName: '',
      status: 'all',
      userId: null,
      createdFrom: '',
      createdTo: '',
      page: 1,
      pageSize: 12,
    });

    expect(result.totalItems).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.statusCounts).toEqual({
      [REQUEST_STATUS.OPENED]: 4,
      [REQUEST_STATUS.PENDING]: 3,
      [REQUEST_STATUS.MATCHED]: 2,
      [REQUEST_STATUS.CLOSED]: 1,
      [REQUEST_STATUS.PROCESSING]: 0,
      [REQUEST_STATUS.RETRYING]: 0,
    });

    expect(result.items).toHaveLength(1);
    const item = result.items[0];

    expect(item.id).toBe(77);
    expect(item.status).toBe(REQUEST_STATUS.MATCHED);
    expect(item.user.displayName).toBe('Alex Chen');
    expect(item.budgetMin).toBe(1000);
    expect(item.budgetMax).toBe(2500);
    expect(item.inviteSummary).toEqual({
      total: 2,
      pending: 1,
      accepted: 1,
      rejected: 0,
    });
    expect(item.proposalSummary).toEqual({
      total: 1,
      pending: 0,
      accepted: 1,
      rejected: 0,
    });

    expect(item.invitedUsers[0].id).toBe(2);
    expect(item.proposals[0]).toEqual(
      expect.objectContaining({
        id: 5,
        status: 'accepted',
        experienceTitle: 'Creative Workshop',
      })
    );
  });
});
