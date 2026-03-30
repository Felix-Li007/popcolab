import 'server-only';

import { prisma } from '@/libs/prisma-client';
import {
  isNotificationQueueJob,
  isRequestQueueJob,
  type NotificationQueueJob,
  type RequestQueueJob,
} from '@/types/queue-job';
import { createModuleLogger } from '@/utils/logging-util';

const logger = createModuleLogger(import.meta.url);

const DEFAULT_REQUEST_QUEUE_NAME = 'default_queue';
const DEFAULT_NOTIFICATION_QUEUE_NAME = 'notification_queue';
const DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 300;
const queueInitializationByName = new Map<string, Promise<void>>();
let pgmqExtensionCheckPromise: Promise<void> | null = null;

type QueueReadRow = {
  msg_id: number;
  read_ct: number;
  enqueued_at: Date | string;
  vt: Date | string;
  message: unknown;
};

export type RequestQueueMessage = {
  messageId: number;
  readCount: number;
  enqueuedAt: Date | string;
  visibilityTimeoutAt: Date | string;
  job: RequestQueueJob;
};

export type NotificationQueueMessage = {
  messageId: number;
  readCount: number;
  enqueuedAt: Date | string;
  visibilityTimeoutAt: Date | string;
  job: NotificationQueueJob;
};

function getRequestQueueName(): string {
  return process.env.SUPABASE_REQUEST_QUEUE || DEFAULT_REQUEST_QUEUE_NAME;
}

function getNotificationQueueName(): string {
  return (
    process.env.SUPABASE_NOTIFICATION_QUEUE || DEFAULT_NOTIFICATION_QUEUE_NAME
  );
}

async function ensureQueueExists(queueName: string) {
  const existingInitialization = queueInitializationByName.get(queueName);

  if (existingInitialization) {
    return existingInitialization;
  }

  const initializationPromise = initializeQueue(queueName);
  queueInitializationByName.set(queueName, initializationPromise);

  try {
    await initializationPromise;
  } catch (error) {
    queueInitializationByName.delete(queueName);
    throw error;
  }
}

// Ensures the request queue exists before jobs are sent or read.
export async function ensureExistQueue() {
  return ensureQueueExists(getRequestQueueName());
}

async function initializeQueue(queueName: string) {
  await ensurePgmqExtensionEnabled();

  const queueTableName = `pgmq.q_${queueName}`;
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT to_regclass(${queueTableName}) IS NOT NULL AS "exists"
  `;

  if (!rows[0]?.exists) {
    await prisma.$executeRaw`SELECT pgmq.create(${queueName})`;
  }
}

async function ensurePgmqExtensionEnabled() {
  if (pgmqExtensionCheckPromise) {
    return pgmqExtensionCheckPromise;
  }

  pgmqExtensionCheckPromise = (async () => {
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'pgmq'
      ) AS "exists"
    `;

    if (!rows[0]?.exists) {
      throw new Error(
        'Missing pgmq extension. Enable it via a database migration or infrastructure setup before using the request queue.'
      );
    }
  })();

  try {
    await pgmqExtensionCheckPromise;
  } catch (error) {
    pgmqExtensionCheckPromise = null;
    throw error;
  }
}

export async function enqueueQueueJob(job: RequestQueueJob) {
  await ensureExistQueue();

  const queueName = getRequestQueueName();
  const rows = await prisma.$queryRaw<{ message_id: number }[]>`
    SELECT pgmq.send(${queueName}, CAST(${JSON.stringify(job)} AS jsonb)) AS message_id
  `;

  return {
    messageId: Number(rows[0]?.message_id ?? 0),
    queueName,
  };
}

export async function readRequestQueueJobs(
  quantity = 10,
  visibilityTimeoutSeconds = DEFAULT_VISIBILITY_TIMEOUT_SECONDS
) {
  await ensureExistQueue();

  const queueName = getRequestQueueName();
  const rows = await prisma.$queryRaw<QueueReadRow[]>`
    SELECT *
    FROM pgmq.read(${queueName}, ${visibilityTimeoutSeconds}, ${quantity})
  `;

  return rows
    .filter(row => isRequestQueueJob(row.message))
    .map<RequestQueueMessage>(row => ({
      messageId: row.msg_id,
      readCount: row.read_ct,
      enqueuedAt: row.enqueued_at,
      visibilityTimeoutAt: row.vt,
      job: row.message as RequestQueueJob,
    }));
}

export async function deleteRequestQueueJob(messageId: number) {
  const queueName = getRequestQueueName();

  await prisma.$queryRaw`SELECT pgmq.delete(${queueName}::text, ${messageId}::bigint)`;
}

export async function enqueueNotificationQueueJob(job: NotificationQueueJob) {
  const queueName = getNotificationQueueName();
  await ensureQueueExists(queueName);

  logger.info(
    {
      queueName,
      jobType: job.type,
      recipientEmail: job.recipientEmail,
    },
    'Enqueue notification queue job started'
  );

  const rows = await prisma.$queryRaw<{ message_id: number }[]>`
    SELECT pgmq.send(${queueName}, CAST(${JSON.stringify(job)} AS jsonb)) AS message_id
  `;

  const messageId = Number(rows[0]?.message_id ?? 0);

  logger.info(
    {
      queueName,
      messageId,
      jobType: job.type,
      recipientEmail: job.recipientEmail,
    },
    'Enqueue notification queue job completed'
  );

  return {
    messageId,
    queueName,
  };
}

export async function readNotificationQueueJobs(
  quantity = 25,
  visibilityTimeoutSeconds = DEFAULT_VISIBILITY_TIMEOUT_SECONDS
) {
  const queueName = getNotificationQueueName();
  await ensureQueueExists(queueName);

  const rows = await prisma.$queryRaw<QueueReadRow[]>`
    SELECT *
    FROM pgmq.read(${queueName}, ${visibilityTimeoutSeconds}, ${quantity})
  `;

  return rows
    .filter(row => isNotificationQueueJob(row.message))
    .map<NotificationQueueMessage>(row => ({
      messageId: row.msg_id,
      readCount: row.read_ct,
      enqueuedAt: row.enqueued_at,
      visibilityTimeoutAt: row.vt,
      job: row.message as NotificationQueueJob,
    }));
}

export async function deleteNotificationQueueJob(messageId: number) {
  const queueName = getNotificationQueueName();
  await prisma.$queryRaw`SELECT pgmq.delete(${queueName}::text, ${messageId}::bigint)`;
}
