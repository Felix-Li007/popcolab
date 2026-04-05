// Triggers that explain why a request job was placed on the async queue.
export const REQUEST_QUEUE_TRIGGER = {
  REQUEST_EXPIRED: 'request_expired',
  INVITED_CONFIRMED: 'invited_confirmed',
  PROPOSAL_REJECTED: 'proposal_rejected',
} as const;

export type RequestQueueTrigger =
  (typeof REQUEST_QUEUE_TRIGGER)[keyof typeof REQUEST_QUEUE_TRIGGER];

export type RequestQueueJob = {
  requestId: number;
  trigger: RequestQueueTrigger;
  rejectedProposalId?: number;
  queuedAt: string;
};

// Runtime guard for validating request queue payloads read back from pgmq.
export function isRequestQueueJob(value: unknown): value is RequestQueueJob {
  if (!value || typeof value !== 'object') return false;

  const job = value as Record<string, unknown>;

  return (
    typeof job.requestId === 'number' &&
    Number.isInteger(job.requestId) &&
    typeof job.queuedAt === 'string' &&
    Object.values(REQUEST_QUEUE_TRIGGER).includes(
      job.trigger as RequestQueueTrigger
    ) &&
    (job.rejectedProposalId === undefined ||
      (typeof job.rejectedProposalId === 'number' &&
        Number.isInteger(job.rejectedProposalId)))
  );
}

// Notification job kinds currently delivered through the async notification queue.
export const NOTIFICATION_QUEUE_JOB_TYPE = {
  EVENT_CANCELED_EMAIL: 'event_canceled_email',
  EVENT_DATE_CANCELED_EMAIL: 'event_date_canceled_email',
  REQUEST_MATCHED_EMAIL: 'request_matched_email',
} as const;

export type NotificationQueueJobType =
  (typeof NOTIFICATION_QUEUE_JOB_TYPE)[keyof typeof NOTIFICATION_QUEUE_JOB_TYPE];

type NotificationQueueJobBase = {
  type: NotificationQueueJobType;
  recipientEmail: string;
  recipientName: string;
  queuedAt: string;
};

type EventNotificationQueueJobBase = NotificationQueueJobBase & {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventLocation: string;
};

export type EventCanceledEmailJob = EventNotificationQueueJobBase & {
  type: typeof NOTIFICATION_QUEUE_JOB_TYPE.EVENT_CANCELED_EMAIL;
};

export type EventDateCanceledEmailJob = EventNotificationQueueJobBase & {
  type: typeof NOTIFICATION_QUEUE_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL;
  canceledDateLabel: string;
  canceledTimeLabel: string | null;
};

export type RequestMatchedEmailJob = NotificationQueueJobBase & {
  type: typeof NOTIFICATION_QUEUE_JOB_TYPE.REQUEST_MATCHED_EMAIL;
  requestId: number;
  objectiveCategory: string;
};

export type NotificationQueueJob =
  | EventCanceledEmailJob
  | EventDateCanceledEmailJob
  | RequestMatchedEmailJob;

// Runtime guard for validating notification queue payloads before delivery.
export function isNotificationQueueJob(
  value: unknown
): value is NotificationQueueJob {
  if (!value || typeof value !== 'object') return false;

  const job = value as Record<string, unknown>;
  const hasBaseFields =
    typeof job.recipientEmail === 'string' &&
    typeof job.recipientName === 'string' &&
    typeof job.queuedAt === 'string';

  if (!hasBaseFields) {
    return false;
  }

  switch (job.type) {
    case NOTIFICATION_QUEUE_JOB_TYPE.EVENT_CANCELED_EMAIL:
      return (
        typeof job.eventTitle === 'string' &&
        typeof job.eventLocation === 'string'
      );
    case NOTIFICATION_QUEUE_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL:
      return (
        typeof job.eventTitle === 'string' &&
        typeof job.eventLocation === 'string' &&
        typeof job.canceledDateLabel === 'string' &&
        (typeof job.canceledTimeLabel === 'string' ||
          job.canceledTimeLabel === null)
      );
    case NOTIFICATION_QUEUE_JOB_TYPE.REQUEST_MATCHED_EMAIL:
      return (
        typeof job.requestId === 'number' &&
        Number.isInteger(job.requestId) &&
        typeof job.objectiveCategory === 'string'
      );
    default:
      return false;
  }
}
