// Triggers that explain why a request job was placed on the async queue.
export const REQUEST_QUEUE_TRIGGER = {
  REQUEST_EXPIRED: 'request_expired',
  INVITED_CONFIRMED: 'invited_confirmed',
  REQUEST_USERS_RESPONDED: 'request_users_responded',
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
export const NOTIFICATION_JOB_TYPE = {
  EVENT_CANCELED_EMAIL: 'event_canceled_email',
  EVENT_DATE_CANCELED_EMAIL: 'event_date_canceled_email',
  EVENT_CREATED_EMAIL: 'event_created_email',
  REQUEST_CHANGED_EMAIL: 'request_changed_email',
  EXPERIENCE_CREATED_EMAIL: 'experience_created_email',
} as const;
type ExperienceNotificationQueueJobBase = NotificationQueueJobBase & {
  experienceTitle: string;
  experienceCategory: string;
  experienceId: number;
};

export type ExperienceCreatedEmailJob = ExperienceNotificationQueueJobBase & {
  type: typeof NOTIFICATION_JOB_TYPE.EXPERIENCE_CREATED_EMAIL;
};

export type NotificationQueueJobType =
  (typeof NOTIFICATION_JOB_TYPE)[keyof typeof NOTIFICATION_JOB_TYPE];

type NotificationQueueJobBase = {
  type: NotificationQueueJobType;
  recipientEmail: string;
  recipientName: string;
  queuedAt: string;
};

type EventNotificationQueueJobBase = NotificationQueueJobBase & {
  eventTitle: string;
  eventLocation: string;
  eventId: number;
};

export type EventCanceledEmailJob = EventNotificationQueueJobBase & {
  type: typeof NOTIFICATION_JOB_TYPE.EVENT_CANCELED_EMAIL;
};

export type EventDateCanceledEmailJob = EventNotificationQueueJobBase & {
  type: typeof NOTIFICATION_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL;
  canceledDateLabel: string;
  canceledTimeLabel: string | null;
};

export type EventCreatedEmailJob = EventNotificationQueueJobBase & {
  type: typeof NOTIFICATION_JOB_TYPE.EVENT_CREATED_EMAIL;
};

export type RequestChangedEmailJob = NotificationQueueJobBase & {
  type: typeof NOTIFICATION_JOB_TYPE.REQUEST_CHANGED_EMAIL;
  requestId: number;
  objectiveCategory: string;
  previousStatus: string | null;
  nextStatus: string;
};

export type NotificationQueueJob =
  | EventCanceledEmailJob
  | EventDateCanceledEmailJob
  | EventCreatedEmailJob
  | RequestChangedEmailJob
  | ExperienceCreatedEmailJob;

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
    case NOTIFICATION_JOB_TYPE.EXPERIENCE_CREATED_EMAIL:
      return (
        typeof job.experienceId === 'number' &&
        Number.isInteger(job.experienceId) &&
        typeof job.experienceTitle === 'string' &&
        typeof job.experienceCategory === 'string'
      );
    case NOTIFICATION_JOB_TYPE.EVENT_CANCELED_EMAIL:
      return (
        typeof job.eventId === 'number' &&
        Number.isInteger(job.eventId) &&
        typeof job.eventTitle === 'string' &&
        typeof job.eventLocation === 'string'
      );
    case NOTIFICATION_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL:
      return (
        typeof job.eventId === 'number' &&
        Number.isInteger(job.eventId) &&
        typeof job.eventTitle === 'string' &&
        typeof job.eventLocation === 'string' &&
        typeof job.canceledDateLabel === 'string' &&
        (typeof job.canceledTimeLabel === 'string' ||
          job.canceledTimeLabel === null)
      );
    case NOTIFICATION_JOB_TYPE.EVENT_CREATED_EMAIL:
      return (
        typeof job.eventId === 'number' &&
        Number.isInteger(job.eventId) &&
        typeof job.eventTitle === 'string' &&
        typeof job.eventLocation === 'string'
      );
    case NOTIFICATION_JOB_TYPE.REQUEST_CHANGED_EMAIL:
      return (
        typeof job.requestId === 'number' &&
        Number.isInteger(job.requestId) &&
        typeof job.objectiveCategory === 'string' &&
        (typeof job.previousStatus === 'string' ||
          job.previousStatus === null) &&
        typeof job.nextStatus === 'string'
      );
    default:
      return false;
  }
}
