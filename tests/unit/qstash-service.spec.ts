jest.mock('@/libs/qstash-client', () => ({
  getQStashClient: jest.fn(),
  getQStashEndpointUrl: jest.fn(),
}));

jest.mock('@/services/queue-service', () => ({
  readRequestQueueJobs: jest.fn(),
  deleteRequestQueueJob: jest.fn(),
  readNotificationQueueJobs: jest.fn(),
  deleteNotificationQueueJob: jest.fn(),
}));

jest.mock('@/services/proposal-service', () => ({
  createFittedProposal: jest.fn(),
}));

jest.mock('@/services/request-service', () => ({
  enqueueRequestReady: jest.fn(),
}));

jest.mock('@/services/delivery-service', () => ({
  processNotificationQueueJob: jest.fn(),
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
  deleteNotificationQueueJob,
  readNotificationQueueJobs,
  readRequestQueueJobs,
} from '@/services/queue-service';
import { processNotificationQueueJob } from '@/services/delivery-service';
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
const readNotificationQueueJobsMock =
  readNotificationQueueJobs as jest.MockedFunction<
    typeof readNotificationQueueJobs
  >;
const deleteNotificationQueueJobMock =
  deleteNotificationQueueJob as jest.MockedFunction<
    typeof deleteNotificationQueueJob
  >;
const createFittedProposalMock = createFittedProposal as jest.MockedFunction<
  typeof createFittedProposal
>;
const processNotificationQueueJobMock =
  processNotificationQueueJob as jest.MockedFunction<
    typeof processNotificationQueueJob
  >;
const enqueueRequestReadyMock = enqueueRequestReady as jest.MockedFunction<
  typeof enqueueRequestReady
>;
const loggerMock = logger as unknown as {
  error: jest.Mock;
};

describe('qstash-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  test('processes notification queue messages and deletes only successful ones', async () => {
    readNotificationQueueJobsMock.mockResolvedValue([
      {
        messageId: 11,
        readCount: 0,
        enqueuedAt: '2026-03-30T12:00:00.000Z',
        visibilityTimeoutAt: '2026-03-30T12:05:00.000Z',
        job: {
          type: 'event_canceled_email',
          recipientEmail: 'member@example.com',
          recipientName: 'Member One',
          eventTitle: 'Spring Gala',
          eventLocation: 'Main Hall',
          queuedAt: '2026-03-30T12:00:00.000Z',
        },
      },
      {
        messageId: 12,
        readCount: 0,
        enqueuedAt: '2026-03-30T12:01:00.000Z',
        visibilityTimeoutAt: '2026-03-30T12:06:00.000Z',
        job: {
          type: 'event_date_canceled_email',
          recipientEmail: 'member2@example.com',
          recipientName: 'Member Two',
          eventTitle: 'Spring Gala',
          eventLocation: 'Main Hall',
          canceledDateLabel: 'Apr 5, 2026',
          canceledTimeLabel: '18:00 - 20:00',
          queuedAt: '2026-03-30T12:01:00.000Z',
        },
      },
    ] as never);
    processNotificationQueueJobMock
      .mockResolvedValueOnce({ id: 'email_1' } as never)
      .mockRejectedValueOnce(new Error('email send failed'));

    const result = await handleQStashTask({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 10,
    });

    expect(readNotificationQueueJobsMock).toHaveBeenCalledWith(10);
    expect(processNotificationQueueJobMock).toHaveBeenCalledTimes(2);
    expect(deleteNotificationQueueJobMock).toHaveBeenCalledTimes(1);
    expect(deleteNotificationQueueJobMock).toHaveBeenCalledWith(11);
    expect(loggerMock.error).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
        messageId: 12,
        notificationType: 'event_date_canceled_email',
        recipientEmail: 'member2@example.com',
      },
      'QStash notification queue message failed'
    );
    expect(result).toEqual({
      ok: true,
      handled: true,
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      processed: [
        {
          messageId: 11,
          status: 'completed',
          detail: 'event_canceled_email',
        },
        {
          messageId: 12,
          status: 'failed',
          detail: 'email send failed',
        },
      ],
    });
  });
});
