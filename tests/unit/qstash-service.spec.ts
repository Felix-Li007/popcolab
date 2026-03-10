jest.mock('@/libs/qstash-client', () => ({
  getQStashClient: jest.fn(),
  getQStashEndpointUrl: jest.fn(),
}));

jest.mock('@/services/queue-service', () => ({
  readRequestQueueJobs: jest.fn(),
  deleteRequestQueueJob: jest.fn(),
}));

jest.mock('@/services/proposal-service', () => ({
  createFittedProposal: jest.fn(),
}));

jest.mock('@/services/request-service', () => ({
  enqueueRequestReady: jest.fn(),
}));

jest.mock('@/utils/logging-util', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import { createFittedProposal } from '@/services/proposal-service';
import {
  deleteRequestQueueJob,
  readRequestQueueJobs,
} from '@/services/queue-service';
import { enqueueRequestReady } from '@/services/request-service';
import {
  handleQStashTask,
  publishQStashTask,
  upsertQueueSchedule,
} from '@/services/qstash-service';
import { QSTASH_TASK_TYPE } from '@/types/qstash-task';
import { logger } from '@/utils/logging-util';

const getQStashClientMock = getQStashClient as jest.MockedFunction<
  typeof getQStashClient
>;
const getQStashEndpointUrlMock = getQStashEndpointUrl as jest.MockedFunction<
  typeof getQStashEndpointUrl
>;
const readRequestQueueJobsMock = readRequestQueueJobs as jest.MockedFunction<
  typeof readRequestQueueJobs
>;
const deleteRequestQueueJobMock = deleteRequestQueueJob as jest.MockedFunction<
  typeof deleteRequestQueueJob
>;
const createFittedProposalMock = createFittedProposal as jest.MockedFunction<
  typeof createFittedProposal
>;
const enqueueRequestReadyMock = enqueueRequestReady as jest.MockedFunction<
  typeof enqueueRequestReady
>;
const loggerMock = logger as unknown as {
  error: jest.Mock;
};

describe('qstash-service', () => {
  beforeEach(() => {
    getQStashEndpointUrlMock.mockReturnValue('https://example.com/api/qstash');
  });

  test('publishQStashTask publishes payloads to the shared endpoint', async () => {
    const publishJSON = jest.fn().mockResolvedValue({ messageId: 'm1' });
    getQStashClientMock.mockReturnValue({
      publishJSON,
    } as never);

    const result = await publishQStashTask(
      {
        type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
        batchSize: 5,
      },
      {
        delay: '10m',
        deduplicationId: 'task-1',
        retries: 5,
      }
    );

    expect(result).toEqual({ messageId: 'm1' });
    expect(publishJSON).toHaveBeenCalledWith({
      url: 'https://example.com/api/qstash',
      body: {
        type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
        batchSize: 5,
      },
      delay: '10m',
      notBefore: undefined,
      deduplicationId: 'task-1',
      retries: 5,
    });
  });

  test('upsertQueueSchedule recreates the fixed request queue schedule', async () => {
    const schedules = {
      get: jest.fn().mockResolvedValue({ scheduleId: 'request-queue-process' }),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest
        .fn()
        .mockResolvedValue({ scheduleId: 'request-queue-process' }),
    };
    getQStashClientMock.mockReturnValue({ schedules } as never);

    const result = await upsertQueueSchedule('*/5 * * * *', 20);

    expect(schedules.get).toHaveBeenCalledWith('request-queue-process');
    expect(schedules.delete).toHaveBeenCalledWith('request-queue-process');
    expect(schedules.create).toHaveBeenCalledWith({
      destination: 'https://example.com/api/qstash',
      scheduleId: 'request-queue-process',
      cron: '*/5 * * * *',
      retries: 3,
      body: JSON.stringify({
        type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
        batchSize: 20,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual({ scheduleId: 'request-queue-process' });
  });

  test('dispatches request ready tasks to request-service', async () => {
    enqueueRequestReadyMock.mockResolvedValue({
      queued: true,
      queueMessageId: 1,
      queueName: 'proposal_generation',
    });

    const result = await handleQStashTask({
      type: QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY,
      requestId: 12,
      trigger: 'request_expired',
    });

    expect(enqueueRequestReadyMock).toHaveBeenCalledWith(12, 'request_expired');
    expect(result).toEqual({
      queued: true,
      queueMessageId: 1,
      queueName: 'proposal_generation',
    });
  });

  test('processes queue messages and deletes only successful ones', async () => {
    readRequestQueueJobsMock.mockResolvedValue([
      {
        messageId: 1,
        readCount: 0,
        enqueuedAt: '2026-03-09T12:00:00.000Z',
        visibilityTimeoutAt: '2026-03-09T12:05:00.000Z',
        job: {
          requestId: 100,
          trigger: 'request_expired',
          queuedAt: '2026-03-09T12:00:00.000Z',
        },
      },
      {
        messageId: 2,
        readCount: 0,
        enqueuedAt: '2026-03-09T12:01:00.000Z',
        visibilityTimeoutAt: '2026-03-09T12:06:00.000Z',
        job: {
          requestId: 101,
          trigger: 'proposal_rejected',
          queuedAt: '2026-03-09T12:01:00.000Z',
        },
      },
    ]);
    createFittedProposalMock
      .mockResolvedValueOnce({
        created: true,
        proposalId: 300,
      })
      .mockRejectedValueOnce(new Error('proposal generation failed'));

    const result = await handleQStashTask({
      type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
      batchSize: 10,
    });

    expect(readRequestQueueJobsMock).toHaveBeenCalledWith(10);
    expect(deleteRequestQueueJobMock).toHaveBeenCalledTimes(1);
    expect(deleteRequestQueueJobMock).toHaveBeenCalledWith(1);
    expect(loggerMock.error).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
        messageId: 2,
        requestId: 101,
      },
      'QStash proposal queue message failed'
    );
    expect(result).toEqual({
      ok: true,
      handled: true,
      type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
      processed: [
        {
          messageId: 1,
          status: 'completed',
          detail: 'proposal_created',
        },
        {
          messageId: 2,
          status: 'failed',
          detail: 'proposal generation failed',
        },
      ],
    });
  });
});
