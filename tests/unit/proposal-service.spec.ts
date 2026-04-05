jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    request: {
      findUnique: jest.fn(),
      update: jest.fn(),
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
  },
}));

jest.mock('@/services/recommend-service', () => ({
  getRequestExperiences: jest.fn(),
}));

import { ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { createFittedProposal } from '@/services/proposal-service';
import { getRequestExperiences } from '@/services/recommend-service';
import { REQUEST_QUEUE_TRIGGER } from '@/types/queue-job';
import { logger } from '@/utils/logging-util';

type PrismaMock = {
  request: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

const prismaMock = prisma as unknown as PrismaMock;
const getRequestExperiencesMock = getRequestExperiences as jest.MockedFunction<
  typeof getRequestExperiences
>;
const loggerMock = logger as unknown as {
  info: jest.Mock;
};

describe('proposal-service', () => {
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

  test('returns existing proposal and updates request to matched when active proposal exists', async () => {
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
    expect(prismaMock.request.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        request_status: REQUEST_STATUS.MATCHED,
      },
    });
  });

  test('creates proposals from recommendation results', async () => {
    const tx = {
      proposal: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 901, experience_id: 55 })
          .mockResolvedValueOnce({ id: 902, experience_id: 56 }),
      },
      request: {
        update: jest.fn().mockResolvedValue({ id: 30 }),
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
    expect(tx.proposal.create).toHaveBeenNthCalledWith(1, {
      data: {
        request_id: 30,
        experience_id: 55,
        proposal_status: ProposalStatus.PENDING,
        objective_alignment: 'source:request',
        base_score: 81,
        risk_adjustment: 18,
        rationale_desc: 'Very similar to request preferences',
      },
      select: {
        id: true,
        experience_id: true,
      },
    });
    expect(tx.proposal.create).toHaveBeenNthCalledWith(2, {
      data: {
        request_id: 30,
        experience_id: 56,
        proposal_status: ProposalStatus.PENDING,
        objective_alignment: 'source:request',
        base_score: 70,
        risk_adjustment: -5,
        rationale_desc: 'Similar to request preferences',
      },
      select: {
        id: true,
        experience_id: true,
      },
    });
    expect(result).toEqual({
      created: true,
      proposalId: 901,
    });
    expect(loggerMock.info).toHaveBeenCalledWith(
      {
        requestId: 30,
        proposalIds: [901, 902],
        experienceIds: [55, 56],
        proposalCount: 2,
        trigger: REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED,
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
      proposal: {
        create: jest.fn().mockResolvedValue({ id: 903, experience_id: 66 }),
      },
      request: {
        update: jest.fn().mockResolvedValue({ id: 32 }),
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
        experience_id: 66,
        proposal_status: ProposalStatus.PENDING,
        objective_alignment: 'source:request',
        base_score: 66,
        risk_adjustment: 0,
        rationale_desc: 'Recommended based on your interests',
      },
      select: {
        id: true,
        experience_id: true,
      },
    });

    expect(result).toEqual({
      created: true,
      proposalId: 903,
    });
  });
});
