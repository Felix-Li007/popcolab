import 'server-only';

import { prisma } from '@/libs/prisma-client';
import { isRequestQueueJob, type RequestQueueJob } from '@/types/queue-job';

const DEFAULT_QUEUE_NAME = 'default_queue';
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

function getQueueName(): string {
  return process.env.SUPABASE_QUEUE_NAME || DEFAULT_QUEUE_NAME;
}

export async function ensureExistQueue() {
  const queueName = getQueueName();
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

async function initializeQueue(queueName: string) {
  await ensurePgmqExtensionEnabled();

  const queueTableName = `pgmq.q_${queueName}`;
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT to_regclass(${queueTableName}) IS NOT NULL AS "exists"
  `;

  if (!rows[0]?.exists) {
    await prisma.$queryRaw`SELECT pgmq.create(${queueName})`;
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

  const queueName = getQueueName();
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

  const queueName = getQueueName();
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
  const queueName = getQueueName();

  await prisma.$queryRaw`SELECT pgmq.delete(${queueName}, ${messageId})`;
}
