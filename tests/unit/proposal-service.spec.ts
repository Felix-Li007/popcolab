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

jest.mock('@/utils/logging-util', () => ({
  logger: {
    info: jest.fn(),
  },
}));

import { ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { createFittedProposal } from '@/services/proposal-service';
import { REQUEST_QUEUE_TRIGGER } from '@/types/queue-job';
import { logger } from '@/utils/logging-util';

type PrismaMock = {
  request: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  experience: {
    findFirst: jest.Mock;
  };
  $transaction: jest.Mock;
};

const prismaMock = prisma as unknown as PrismaMock;
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

  test('creates a proposal with the matching candidate', async () => {
    const tx = {
      proposal: {
        create: jest.fn().mockResolvedValue({ id: 901 }),
      },
      request: {
        update: jest.fn().mockResolvedValue({ id: 30 }),
      },
    };

    prismaMock.request.findUnique.mockResolvedValue({
      id: 30,
      budget_min: 100,
      budget_max: 200,
      duration_max: 90,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [],
    });
    prismaMock.experience.findFirst.mockResolvedValue({
      id: 55,
      experience_name: 'Workshop',
    });
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    const result = await createFittedProposal({
      requestId: 30,
      trigger: REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(prismaMock.experience.findFirst).toHaveBeenCalledWith({
      where: {
        duration_max: { lte: 90 },
        starting_price: {
          gte: 100,
          lte: 200,
        },
      },
      orderBy: [
        { starting_price: 'asc' },
        { duration_max: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        experience_name: true,
      },
    });
    expect(tx.proposal.create).toHaveBeenCalledWith({
      data: {
        request_id: 30,
        experience_id: 55,
        proposal_status: ProposalStatus.pending,
        objective_alignment: `Generated from ${REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED}`,
        base_score: 100,
        risk_adjustment: 0,
        rationale_desc:
          'Auto-generated for request 30 using experience Workshop.',
      },
      select: {
        id: true,
      },
    });
    expect(result).toEqual({
      created: true,
      proposalId: 901,
    });
    expect(loggerMock.info).toHaveBeenCalledWith(
      {
        requestId: 30,
        proposalId: 901,
        experienceId: 55,
        trigger: REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED,
      },
      'Proposal generated from queue job'
    );
  });

  test('falls back to the cheapest experience when no exact candidate matches', async () => {
    const tx = {
      proposal: {
        create: jest.fn().mockResolvedValue({ id: 902 }),
      },
      request: {
        update: jest.fn().mockResolvedValue({ id: 31 }),
      },
    };

    prismaMock.request.findUnique.mockResolvedValue({
      id: 31,
      budget_min: 500,
      budget_max: 600,
      duration_max: 30,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [],
    });
    prismaMock.experience.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 66,
        experience_name: 'Fallback experience',
      });
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    const result = await createFittedProposal({
      requestId: 31,
      trigger: REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED,
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(prismaMock.experience.findFirst).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      created: true,
      proposalId: 902,
    });
  });

  test('throws when no experience is available at all', async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      id: 32,
      budget_min: null,
      budget_max: null,
      duration_max: null,
      request_status: REQUEST_STATUS.OPENED,
      proposals: [],
    });
    prismaMock.experience.findFirst.mockResolvedValue(null);

    await expect(
      createFittedProposal({
        requestId: 32,
        trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
        queuedAt: '2026-03-09T12:00:00.000Z',
      })
    ).rejects.toThrow('No experience is available to generate a proposal.');
  });
});
