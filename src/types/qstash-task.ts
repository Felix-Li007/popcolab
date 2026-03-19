import {
  REQUEST_QUEUE_TRIGGER,
  type RequestQueueTrigger,
} from '@/types/queue-job';

export const QSTASH_TASK_TYPE = {
  REQUEST_ENQUEUE_READY: 'request.proposal.enqueue-if-ready',
  REQUEST_QUEUE_PROCESS: 'request.queue.process',
  EXPERIENCE_ORDER_EXPIRE: 'experience.order.expire',
} as const;

export type RequestEnqueuePayload = {
  type: typeof QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY;
  requestId: number;
  trigger: RequestQueueTrigger;
};

export type RequestProcessPayload = {
  type: typeof QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS;
  batchSize: number;
};

export type ExperienceOrderExpirePayload = {
  type: typeof QSTASH_TASK_TYPE.EXPERIENCE_ORDER_EXPIRE;
  orderId: number;
};

export type QStashTaskPayload =
  | RequestEnqueuePayload
  | RequestProcessPayload
  | ExperienceOrderExpirePayload;

export function isQStashTaskPayload(
  payload: unknown
): payload is QStashTaskPayload {
  if (!payload || typeof payload !== 'object') return false;

  const taskPayload = payload as Record<string, unknown>;
  switch (taskPayload.type) {
    case QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY:
      return (
        typeof taskPayload.requestId === 'number' &&
        Number.isInteger(taskPayload.requestId) &&
        Object.values(REQUEST_QUEUE_TRIGGER).includes(
          taskPayload.trigger as RequestQueueTrigger
        )
      );
    case QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS:
      return (
        typeof taskPayload.batchSize === 'number' &&
        Number.isInteger(taskPayload.batchSize) &&
        taskPayload.batchSize > 0
      );
    case QSTASH_TASK_TYPE.EXPERIENCE_ORDER_EXPIRE:
      return (
        typeof taskPayload.orderId === 'number' &&
        Number.isInteger(taskPayload.orderId) &&
        taskPayload.orderId > 0
      );
    default:
      return false;
  }
}
