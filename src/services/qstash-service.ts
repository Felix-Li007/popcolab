import 'server-only';

import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import {
  deleteRequestQueueJob,
  readRequestQueueJobs,
} from '@/services/queue-service';
import { expireExperienceOrderIfDue } from '@/services/order-service';
import { refreshUserPreference } from '@/services/preference-service';
import { createFittedProposal } from '@/services/proposal-service';
import { enqueueRequestReady } from '@/services/request-service';
import {
  type ExperienceOrderExpirePayload,
  QSTASH_TASK_TYPE,
  type ExperienceCompletedPayload,
  type RequestProcessPayload,
  type QStashTaskPayload,
  type RequestEnqueuePayload,
} from '@/types/qstash-task';
import { logger } from '@/utils/logging-util';

type QStashDelay = `${bigint}${'s' | 'm' | 'h' | 'd'}` | number;

type PublishTaskOptions = {
  delay?: QStashDelay;
  notBefore?: number;
  deduplicationId?: string;
  retries?: number;
};

export async function publishQStashTask(
  payload: QStashTaskPayload,
  options: PublishTaskOptions = {}
) {
  const client = getQStashClient();

  return client.publishJSON({
    url: getQStashEndpointUrl(),
    body: payload,
    delay: options.delay,
    notBefore: options.notBefore,
    deduplicationId: options.deduplicationId,
    retries: options.retries ?? 3,
  });
}

export async function upsertQueueSchedule(cron = '* * * * *', batchSize = 10) {
  const client = getQStashClient();
  const scheduleId = 'request-queue-process';

  try {
    await client.schedules.get(scheduleId);
    await client.schedules.delete(scheduleId);
  } catch {
    // Ignore missing schedules so create behaves like an upsert.
  }

  return client.schedules.create({
    destination: getQStashEndpointUrl(),
    scheduleId,
    cron,
    retries: 3,
    body: JSON.stringify({
      type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
      batchSize,
    } satisfies RequestProcessPayload),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function deleteQueueSchedule(scheduleId: string) {
  return getQStashClient().schedules.delete(scheduleId);
}

export async function handleQStashTask(payload: QStashTaskPayload) {
  switch (payload.type) {
    case QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY:
      return handleRequestReady(payload);
    case QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS:
      return handleRequestProcess(payload);
    case QSTASH_TASK_TYPE.EXPERIENCE_ORDER_EXPIRE:
      return handleExperienceOrderExpiry(payload);
    case QSTASH_TASK_TYPE.EXPERIENCE_COMPLETED:
      return handleExperienceCompleted(payload);
    default:
      return assertNever(payload);
  }
}

async function handleRequestReady(payload: RequestEnqueuePayload) {
  return enqueueRequestReady(payload.requestId, payload.trigger);
}

async function handleRequestProcess(payload: RequestProcessPayload) {
  const messages = await readRequestQueueJobs(payload.batchSize);
  const processed: Array<{
    messageId: number;
    status: 'completed' | 'failed';
    detail: string;
  }> = [];

  for (const message of messages) {
    try {
      const result = await createFittedProposal(message.job);
      await deleteRequestQueueJob(message.messageId);
      processed.push({
        messageId: message.messageId,
        status: 'completed',
        detail: result.created ? 'proposal_created' : String(result.reason),
      });
    } catch (error) {
      logger.error(
        {
          error,
          messageId: message.messageId,
          requestId: message.job.requestId,
        },
        'QStash proposal queue message failed'
      );
      processed.push({
        messageId: message.messageId,
        status: 'failed',
        detail: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  return {
    ok: true,
    handled: true,
    type: payload.type,
    processed,
  };
}

async function handleExperienceOrderExpiry(
  payload: ExperienceOrderExpirePayload
) {
  const result = await expireExperienceOrderIfDue(payload.orderId);

  return {
    ok: true,
    handled: true,
    type: payload.type,
    orderId: payload.orderId,
    result,
  };
}

async function handleExperienceCompleted(payload: ExperienceCompletedPayload) {
  const result = await refreshUserPreference(payload.userExperienceId);

  return {
    ok: true,
    handled: true,
    type: payload.type,
    userExperienceId: payload.userExperienceId,
    result,
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled QStash task: ${JSON.stringify(value)}`);
}
