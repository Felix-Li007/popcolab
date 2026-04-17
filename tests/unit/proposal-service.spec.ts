jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    request: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    proposal: {
      findUnique: jest.fn(),
    },
    experience: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/libs/prisma/client', () => ({
  ProposalStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
  },
  RequestStatus: {
    opened: 'opened',
    pending: 'pending',
    matched: 'matched',
    closed: 'closed',
  },
}));

jest.mock('@/utils/logging-util', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/services/recommend-service', () => ({
  getRequestExperiences: jest.fn(),
}));

jest.mock('@/services/notification-service', () => ({
  enqueueRequestChangedNotification: jest.fn(),
}));

import { ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import {
  approveAdminProposal,
  createFittedProposal,
} from '@/services/proposal-service';
import { enqueueRequestChangedNotification } from '@/services/notification-service';
import { getRequestExperiences } from '@/services/recommend-service';
import { REQUEST_QUEUE_TRIGGER } from '@/types/queue-job';
import { logger } from '@/utils/logging-util';

type PrismaMock = {
  request: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  proposal: {
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
};

const prismaMock = prisma as unknown as PrismaMock;
const getRequestExperiencesMock = getRequestExperiences as jest.MockedFunction<
  typeof getRequestExperiences
>;
const enqueueRequestChangedNotificationMock =
  enqueueRequestChangedNotification as jest.MockedFunction<
    typeof enqueueRequestChangedNotification
  >;
const loggerMock = logger as unknown as {
  info: jest.Mock;
  warn: jest.Mock;
};

describe('proposal-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws when the request cannot be found', async () => {
    prismaMock.request.findUnique.mockResolvedValue(null);

    await expect(
      createFittedProposal({
        requestId: 123,
        trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
        queuedAt: '2026-03-09T12:00:00.000Z',
      })
    ).rejects.toThrow('Request 123 not found.');
  });

  test('returns existing proposal without changing request status when active proposal exists', async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      id: 10,
      budget_min: null,
      budget_max: null,
      duration_max: null,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [{ id: 77 }],
    });
    prismaMock.request.update.mockResolvedValue({ id: 10 });

    const result = await createFittedProposal({
      requestId: 10,
      trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(result).toEqual({
      created: false,
      reason: 'active_proposal_exists',
      proposalId: 77,
    });
    expect(prismaMock.request.update).not.toHaveBeenCalled();
  });

  test('creates proposals from recommendation results', async () => {
    const tx = {
      request: {
        findUnique: jest.fn().mockResolvedValue({
          id: 30,
          proposals: [],
        }),
      },
      proposal: {
        create: jest.fn().mockResolvedValue({ id: 901 }),
      },
      proposalExperience: {
        create: jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({}),
      },
    };

    prismaMock.request.findUnique.mockResolvedValue({
      id: 30,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [],
    });
    getRequestExperiencesMock.mockResolvedValue([
      {
        experience: { id: 55 } as never,
        score: 0.91,
        reason: 'Very similar to request preferences',
        recommendationSource: 'request',
        breakdown: {
          baseScore: 0.81,
          debriefBoost: 0.1,
          opennessBoost: 0.08,
        },
      },
      {
        experience: { id: 56 } as never,
        score: 0.79,
        reason: 'Similar to request preferences',
        recommendationSource: 'request',
        breakdown: {
          baseScore: 0.7,
          debriefBoost: -0.05,
          opennessBoost: 0,
        },
      },
    ]);
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    const result = await createFittedProposal({
      requestId: 30,
      trigger: REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(getRequestExperiencesMock).toHaveBeenCalledWith(30, [], 10);
    expect(tx.proposal.create).toHaveBeenCalledWith({
      data: {
        request_id: 30,
        proposal_status: ProposalStatus.PENDING,
        objective_alignment: 'source:request',
      },
      select: {
        id: true,
      },
    });
    expect(tx.proposalExperience.create).toHaveBeenNthCalledWith(1, {
      data: {
        proposal_id: 901,
        experience_id: 55,
        base_score: 81,
        risk_adjustment: 18,
        rationale_desc: 'Very similar to request preferences',
      },
    });
    expect(tx.proposalExperience.create).toHaveBeenNthCalledWith(2, {
      data: {
        proposal_id: 901,
        experience_id: 56,
        base_score: 70,
        risk_adjustment: -5,
        rationale_desc: 'Similar to request preferences',
      },
    });
    expect(result).toEqual({
      created: true,
      proposalId: 901,
    });
    expect(prismaMock.request.update).not.toHaveBeenCalled();
    expect(enqueueRequestChangedNotificationMock).not.toHaveBeenCalled();
    expect(loggerMock.info).toHaveBeenCalledWith(
      {
        requestId: 30,
        proposalIds: [901],
        experienceIds: [55, 56],
        proposalCount: 1,
        trigger: REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED,
      },
      'Proposal generated from queue job'
    );
  });

  test('only keeps the top 3 recommended experiences in one proposal', async () => {
    const tx = {
      request: {
        findUnique: jest.fn().mockResolvedValue({
          id: 33,
          proposals: [],
        }),
      },
      proposal: {
        create: jest.fn().mockResolvedValue({ id: 904 }),
      },
      proposalExperience: {
        create: jest
          .fn()
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({}),
      },
    };

    prismaMock.request.findUnique.mockResolvedValue({
      id: 33,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [],
    });
    getRequestExperiencesMock.mockResolvedValue([
      {
        experience: { id: 101 } as never,
        score: 0.98,
        reason: 'Top match 1',
        recommendationSource: 'request',
      },
      {
        experience: { id: 102 } as never,
        score: 0.95,
        reason: 'Top match 2',
        recommendationSource: 'request',
      },
      {
        experience: { id: 103 } as never,
        score: 0.92,
        reason: 'Top match 3',
        recommendationSource: 'request',
      },
      {
        experience: { id: 104 } as never,
        score: 0.89,
        reason: 'Should be trimmed out',
        recommendationSource: 'request',
      },
    ]);
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    const result = await createFittedProposal({
      requestId: 33,
      trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(tx.proposalExperience.create).toHaveBeenCalledTimes(3);
    expect(tx.proposalExperience.create).toHaveBeenNthCalledWith(1, {
      data: {
        proposal_id: 904,
        experience_id: 101,
        base_score: 98,
        risk_adjustment: 0,
        rationale_desc: 'Top match 1',
      },
    });
    expect(tx.proposalExperience.create).toHaveBeenNthCalledWith(2, {
      data: {
        proposal_id: 904,
        experience_id: 102,
        base_score: 95,
        risk_adjustment: 0,
        rationale_desc: 'Top match 2',
      },
    });
    expect(tx.proposalExperience.create).toHaveBeenNthCalledWith(3, {
      data: {
        proposal_id: 904,
        experience_id: 103,
        base_score: 92,
        risk_adjustment: 0,
        rationale_desc: 'Top match 3',
      },
    });
    expect(result).toEqual({
      created: true,
      proposalId: 904,
    });
    expect(loggerMock.info).toHaveBeenCalledWith(
      {
        requestId: 33,
        proposalIds: [904],
        experienceIds: [101, 102, 103],
        proposalCount: 1,
        trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
      },
      'Proposal generated from queue job'
    );
  });

  test('returns no_recommendations when recommendation results are empty', async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      id: 31,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [],
    });
    getRequestExperiencesMock.mockResolvedValue([]);

    const result = await createFittedProposal({
      requestId: 31,
      trigger: REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(result).toEqual({
      created: false,
      reason: 'no_recommendations',
      proposalId: null,
    });
  });

  test('creates proposal even when breakdown is missing', async () => {
    const tx = {
      request: {
        findUnique: jest.fn().mockResolvedValue({
          id: 32,
          proposals: [],
        }),
      },
      proposal: {
        create: jest.fn().mockResolvedValue({ id: 903 }),
      },
      proposalExperience: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prismaMock.request.findUnique.mockResolvedValue({
      id: 32,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [],
    });
    getRequestExperiencesMock.mockResolvedValue([
      {
        experience: { id: 66 } as never,
        score: 0.66,
        reason: 'Recommended based on your interests',
        recommendationSource: 'request',
      },
    ]);
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    const result = await createFittedProposal({
      requestId: 32,
      trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(tx.proposal.create).toHaveBeenCalledWith({
      data: {
        request_id: 32,
        proposal_status: ProposalStatus.PENDING,
        objective_alignment: 'source:request',
      },
      select: {
        id: true,
      },
    });
    expect(tx.proposalExperience.create).toHaveBeenCalledWith({
      data: {
        proposal_id: 903,
        experience_id: 66,
        base_score: 66,
        risk_adjustment: 0,
        rationale_desc: 'Recommended based on your interests',
      },
    });

    expect(result).toEqual({
      created: true,
      proposalId: 903,
    });
    expect(prismaMock.request.update).not.toHaveBeenCalled();
  });

  test('skips creation when a concurrent active proposal is found inside the transaction', async () => {
    const tx = {
      request: {
        findUnique: jest.fn().mockResolvedValue({
          id: 50,
          proposals: [{ id: 777 }],
        }),
      },
      proposal: {
        create: jest.fn(),
      },
      proposalExperience: {
        create: jest.fn(),
      },
    };

    prismaMock.request.findUnique.mockResolvedValue({
      id: 50,
      request_status: REQUEST_STATUS.PENDING,
      proposals: [],
    });
    getRequestExperiencesMock.mockResolvedValue([
      {
        experience: { id: 88 } as never,
        score: 0.8,
        reason: 'Recommended option',
        recommendationSource: 'request',
      },
    ]);
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    const result = await createFittedProposal({
      requestId: 50,
      trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(result).toEqual({
      created: false,
      reason: 'active_proposal_exists',
      proposalId: 777,
    });
    expect(tx.proposal.create).not.toHaveBeenCalled();
    expect(tx.proposalExperience.create).not.toHaveBeenCalled();
  });

  test('approves proposal and marks request as matched', async () => {
    prismaMock.proposal.findUnique.mockResolvedValue({
      id: 41,
      proposal_status: ProposalStatus.PENDING,
      request: {
        id: 12,
        request_status: REQUEST_STATUS.PENDING,
        objective_category: 'Team Bonding',
        user: {
          id: 9,
          email: 'owner@example.com',
          user_name: 'owner',
          profile: {
            first_name: 'Owner',
            last_name: 'User',
          },
        },
      },
    });

    const tx = {
      proposal: {
        update: jest.fn().mockResolvedValue({ id: 41 }),
      },
      request: {
        update: jest.fn().mockResolvedValue({ id: 12 }),
      },
    };
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    const result = await approveAdminProposal(41);

    expect(result).toEqual({
      success: true,
      message:
        'Proposal approved, request status updated, and notifications queued.',
    });
    expect(tx.proposal.update).toHaveBeenCalledWith({
      where: { id: 41 },
      data: {
        proposal_status: ProposalStatus.APPROVED,
        reject_notes: null,
      },
    });
    expect(tx.request.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        request_status: REQUEST_STATUS.MATCHED,
      },
    });
    expect(enqueueRequestChangedNotificationMock).toHaveBeenCalledWith({
      requestId: 12,
      previousStatus: REQUEST_STATUS.PENDING,
      nextStatus: REQUEST_STATUS.MATCHED,
    });
  });
});
