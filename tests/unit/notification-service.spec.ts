import { prisma } from '@/libs/prisma-client';
import { MessageType } from '@/libs/prisma/client';

jest.mock('@/libs/prisma/client', () => ({
  MessageType: {
    EVENT_CANCELED: 'EVENT_CANCELED',
    DATE_CANCELED: 'DATE_CANCELED',
    REQUEST_CHANGED: 'REQUEST_CHANGED',
  },
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
    }),
    join: (values: unknown[]) => values,
    empty: {},
  },
}));

jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    request: {
      findUnique: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock('@/services/queue-service', () => ({
  enqueueNotificationQueueJob: jest.fn(),
}));

jest.mock('@/services/qstash-service', () => ({
  publishQStashTask: jest.fn(),
}));

import {
  enqueueEventCanceledNotifications,
  enqueueDateCanceledNotifications,
  enqueueRequestChangedNotification,
} from '@/services/notification-service';
import { enqueueNotificationQueueJob } from '@/services/queue-service';
import { publishQStashTask } from '@/services/qstash-service';
import { NOTIFICATION_JOB_TYPE } from '@/types/queue-job';
import { QSTASH_TASK_TYPE } from '@/types/qstash-task';

type MockedPrisma = {
  $queryRaw: jest.Mock;
  request: {
    findUnique: jest.Mock;
  };
  notification: {
    createMany: jest.Mock;
  };
};

const prismaMock = prisma as unknown as MockedPrisma;
const enqueueNotificationQueueJobMock =
  enqueueNotificationQueueJob as jest.MockedFunction<
    typeof enqueueNotificationQueueJob
  >;
const publishQStashTaskMock = publishQStashTask as jest.MockedFunction<
  typeof publishQStashTask
>;

describe('notification-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-30T12:00:00.000Z'));

    enqueueNotificationQueueJobMock.mockResolvedValue({
      queueName: 'notification_queue',
      messageId: 1,
    } as never);
    publishQStashTaskMock.mockResolvedValue({ messageId: 'msg_1' } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('enqueueEventCanceledNotifications creates in-app notifications, deduplicates recipients, and publishes the queue processor', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      {
        user_id: 7,
        email: 'member@example.com',
        user_name: 'Member One',
      },
      {
        user_id: 9,
        email: 'other@example.com',
        user_name: 'Member Two',
      },
    ]);
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

    const result = await enqueueEventCanceledNotifications({
      eventId: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
    });

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
      data: [
        {
          user_id: 7,
          message_type: MessageType.EVENT_CANCELED,
          message_title: 'Event canceled: Spring Gala',
          message_body: 'Spring Gala at Main Hall has been canceled.',
          message_data: {
            eventId: 15,
            eventTitle: 'Spring Gala',
            eventLocation: 'Main Hall',
            cancellationType: 'event',
          },
        },
        {
          user_id: 9,
          message_type: MessageType.EVENT_CANCELED,
          message_title: 'Event canceled: Spring Gala',
          message_body: 'Spring Gala at Main Hall has been canceled.',
          message_data: {
            eventId: 15,
            eventTitle: 'Spring Gala',
            eventLocation: 'Main Hall',
            cancellationType: 'event',
          },
        },
      ],
    });
    expect(enqueueNotificationQueueJobMock).toHaveBeenCalledWith({
      type: NOTIFICATION_JOB_TYPE.EVENT_CANCELED_EMAIL,
      recipientEmail: 'member@example.com',
      recipientName: 'Member One',
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      queuedAt: '2026-03-30T12:00:00.000Z',
    });
    expect(publishQStashTaskMock).toHaveBeenCalledWith({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });
    expect(result).toEqual({
      recipientCount: 2,
      queuedCount: 2,
    });
  });

  test('enqueueEventDateCanceledNotifications targets only orders for the canceled date and queues a date-specific email job', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      {
        user_id: 7,
        email: 'member@example.com',
        user_name: 'Member One',
      },
    ]);
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

    const result = await enqueueDateCanceledNotifications({
      eventId: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      canceledCalendars: [
        {
          event_date: new Date('2026-04-05T00:00:00.000Z'),
          start_time: new Date('1970-01-01T18:00:00.000Z'),
          end_time: new Date('1970-01-01T20:00:00.000Z'),
        },
      ],
    });

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
      data: [
        {
          user_id: 7,
          message_type: MessageType.DATE_CANCELED,
          message_title: 'Event date canceled: Spring Gala',
          message_body:
            'Spring Gala on Apr 5, 2026 18:00 - 20:00 has been canceled.',
          message_data: {
            eventId: 15,
            eventTitle: 'Spring Gala',
            eventLocation: 'Main Hall',
            cancellationType: 'date',
            canceledDateLabel: 'Apr 5, 2026',
            canceledTimeLabel: '18:00 - 20:00',
          },
        },
      ],
    });
    expect(enqueueNotificationQueueJobMock).toHaveBeenCalledWith({
      type: NOTIFICATION_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL,
      recipientEmail: 'member@example.com',
      recipientName: 'Member One',
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      canceledDateLabel: 'Apr 5, 2026',
      canceledTimeLabel: '18:00 - 20:00',
      queuedAt: '2026-03-30T12:00:00.000Z',
    });
    expect(publishQStashTaskMock).toHaveBeenCalledWith({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });
    expect(result).toEqual({
      recipientCount: 1,
      queuedCount: 1,
    });
  });

  test('enqueueRequestChangedNotification creates an in-app notification and queues a request status email', async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      id: 44,
      objective_category: 'Team Bonding',
      user: {
        id: 12,
        email: 'member@example.com',
        user_name: 'Member One',
      },
      proposals: [{ id: 98 }],
    });
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

    const result = await enqueueRequestChangedNotification({
      requestId: 44,
      previousStatus: 'PENDING',
      nextStatus: 'MATCHED',
    });

    expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
      data: [
        {
          user_id: 12,
          message_type: MessageType.REQUEST_CHANGED,
          message_title: 'Request #44 status changed to MATCHED',
          message_body: 'Your request status changed from pending to matched.',
          message_data: {
            requestId: 44,
            proposalId: 98,
            objectiveCategory: 'Team Bonding',
            previousStatus: 'PENDING',
            nextStatus: 'MATCHED',
          },
        },
      ],
    });
    expect(enqueueNotificationQueueJobMock).toHaveBeenCalledWith({
      type: NOTIFICATION_JOB_TYPE.REQUEST_CHANGED_EMAIL,
      recipientEmail: 'member@example.com',
      recipientName: 'Member One',
      requestId: 44,
      objectiveCategory: 'Team Bonding',
      previousStatus: 'PENDING',
      nextStatus: 'MATCHED',
      queuedAt: '2026-03-30T12:00:00.000Z',
    });
    expect(result).toEqual({
      recipientCount: 1,
      queuedCount: 1,
    });
  });
});
