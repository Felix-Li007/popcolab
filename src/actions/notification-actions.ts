'use server';

import { prisma } from '@/libs/prisma-client';
import { getCurrentDbUserId } from '@/services/clerk-service';

export type Notification = {
  id: number;
  message_type: string;
  message_title: string;
  message_body: string;
  message_data?: unknown;
  read_at?: string | null;
  created_at: string;
};

export async function fetchNotifications(): Promise<Notification[]> {
  const userId = await getCurrentDbUserId();
  if (!userId) return [];

  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 20,
  });

  return notifications.map(notification => ({
    id: notification.id,
    message_type: notification.message_type,
    message_title: notification.message_title,
    message_body: notification.message_body,
    message_data: notification.message_data,
    read_at: notification.read_at?.toISOString() ?? null,
    created_at: notification.created_at.toISOString(),
  }));
}

export async function fetchUnreadCount(): Promise<number> {
  const userId = await getCurrentDbUserId();
  if (!userId) return 0;

  const unread = await prisma.notification.count({
    where: { user_id: userId, read_at: null },
  });

  return unread;
}

export async function markAllAsRead(): Promise<void> {
  const userId = await getCurrentDbUserId();
  if (!userId) return;

  await prisma.notification.updateMany({
    where: { user_id: userId, read_at: null },
    data: { read_at: new Date(), message_status: 'READ' },
  });
}
