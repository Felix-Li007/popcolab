jest.mock('@/services/clerk-service', () => ({
  getCurrentDbUserId: jest.fn(),
}));

jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/libs/prisma-client';
import { getCurrentDbUserId } from '@/services/clerk-service';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
} from '@/actions/notification-actions';

type MockedPrisma = {
  notification: {
    findMany: jest.Mock;
    count: jest.Mock;
    deleteMany: jest.Mock;
  };
};

const prismaMock = prisma as unknown as MockedPrisma;
const getCurrentDbUserIdMock = getCurrentDbUserId as jest.MockedFunction<
  typeof getCurrentDbUserId
>;

describe('notification-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchNotifications returns only the signed in user notifications', async () => {
    getCurrentDbUserIdMock.mockResolvedValue(42 as never);
    prismaMock.notification.findMany.mockResolvedValue([
      {
        id: 7,
        message_type: 'REQUEST_CHANGED',
        message_title: 'Request updated',
        message_body: 'Your request changed.',
        message_data: { requestId: 99 },
        read_at: null,
        created_at: new Date('2026-04-17T10:00:00.000Z'),
      },
    ]);

    await expect(fetchNotifications()).resolves.toEqual([
      {
        id: 7,
        message_type: 'REQUEST_CHANGED',
        message_title: 'Request updated',
        message_body: 'Your request changed.',
        message_data: { requestId: 99 },
        read_at: null,
        created_at: '2026-04-17T10:00:00.000Z',
      },
    ]);

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { user_id: 42 },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
  });

  test('fetchUnreadCount scopes the count to the signed in user', async () => {
    getCurrentDbUserIdMock.mockResolvedValue(42 as never);
    prismaMock.notification.count.mockResolvedValue(3);

    await expect(fetchUnreadCount()).resolves.toBe(3);

    expect(prismaMock.notification.count).toHaveBeenCalledWith({
      where: { user_id: 42, read_at: null },
    });
  });

  test('markAllAsRead deletes only the signed in user notifications', async () => {
    getCurrentDbUserIdMock.mockResolvedValue(42 as never);
    prismaMock.notification.deleteMany.mockResolvedValue({ count: 5 });

    await expect(markAllAsRead()).resolves.toBeUndefined();

    expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
      where: { user_id: 42 },
    });
  });

  test('markAllAsRead returns early when there is no signed in user', async () => {
    getCurrentDbUserIdMock.mockResolvedValue(null as never);

    await expect(markAllAsRead()).resolves.toBeUndefined();

    expect(prismaMock.notification.deleteMany).not.toHaveBeenCalled();
  });
});
