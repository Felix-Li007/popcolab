import 'server-only';

import { EventCancellationEmail } from '@/emails/templates/event-cancel-template';
import { RequestStatusChangedEmail } from '@/emails/templates/request-matched-template';
import { EventCreatedEmail } from '@/emails/templates/event-created-template';
import { ExperienceCreatedEmail } from '@/emails/templates/experience-created-template';
import { sendResendEmail } from '@/services/resend-service';
import { buildEventFullUrl, buildExperienceFullUrl } from '@/utils/url-helper';

import {
  NOTIFICATION_JOB_TYPE,
  EventDateCanceledEmailJob,
  RequestChangedEmailJob,
  EventCanceledEmailJob,
  EventCreatedEmailJob,
  ExperienceCreatedEmailJob,
  type NotificationQueueJob,
} from '@/types/queue-job';
import { createModuleLogger } from '@/utils/logging-util';

const logger = createModuleLogger(import.meta.url);

function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() ?? '';
}

function buildEventCanceledSubject(eventTitle: string) {
  return `Event canceled: ${eventTitle}`;
}

function buildEventDateCanceledSubject(eventTitle: string) {
  return `Event date canceled: ${eventTitle}`;
}

function buildRequestChangedSubject(requestId: number, nextStatus: string) {
  return `Request #${requestId} status changed to ${nextStatus}`;
}

const notificationHandlers: Record<
  string,
  (
    job: NotificationQueueJob,
    resendFrom: string
  ) => Promise<{ id: string | null }>
> = {
  [NOTIFICATION_JOB_TYPE.EVENT_CANCELED_EMAIL]: (job, resendFrom) => {
    const concreteJob = job as EventCanceledEmailJob;
    const result = sendResendEmail({
      to: concreteJob.recipientEmail,
      from: resendFrom,
      subject: buildEventCanceledSubject(concreteJob.eventTitle),
      react: EventCancellationEmail({
        recipientName: concreteJob.recipientName,
        eventTitle: concreteJob.eventTitle,
        eventLocation: concreteJob.eventLocation,
        cancellationType: 'event',
      }),
    });
    return result;
  },

  [NOTIFICATION_JOB_TYPE.REQUEST_CHANGED_EMAIL]: async (job, resendFrom) => {
    const concreteJob = job as RequestChangedEmailJob;
    const result = await sendResendEmail({
      to: concreteJob.recipientEmail,
      from: resendFrom,
      subject: buildRequestChangedSubject(
        concreteJob.requestId,
        concreteJob.nextStatus
      ),
      react: RequestStatusChangedEmail({
        recipientName: concreteJob.recipientName,
        requestId: concreteJob.requestId,
        objectiveCategory: concreteJob.objectiveCategory,
        previousStatus: concreteJob.previousStatus,
        nextStatus: concreteJob.nextStatus,
      }),
    });
    return result;
  },

  [NOTIFICATION_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL]: (job, resendFrom) => {
    const concreteJob = job as EventDateCanceledEmailJob;
    return sendResendEmail({
      to: job.recipientEmail,
      from: resendFrom,
      subject: buildEventDateCanceledSubject(concreteJob.eventTitle),
      react: EventCancellationEmail({
        recipientName: concreteJob.recipientName,
        eventTitle: concreteJob.eventTitle,
        eventLocation: concreteJob.eventLocation,
        cancellationType: 'date',
        canceledDateLabel: concreteJob.canceledDateLabel,
        canceledTimeLabel: concreteJob.canceledTimeLabel,
      }),
    });
  },
  [NOTIFICATION_JOB_TYPE.EVENT_CREATED_EMAIL]: (job, resendFrom) => {
    const createdJob = job as EventCreatedEmailJob;
    const eventLink = buildEventFullUrl(createdJob.eventId);
    return sendResendEmail({
      to: createdJob.recipientEmail,
      from: resendFrom,
      subject: `New event created: ${createdJob.eventTitle}`,
      react: EventCreatedEmail({
        recipientName: createdJob.recipientName,
        eventTitle: createdJob.eventTitle,
        eventLocation: createdJob.eventLocation,
        eventLink,
      }),
    });
  },
  [NOTIFICATION_JOB_TYPE.EXPERIENCE_CREATED_EMAIL]: (job, resendFrom) => {
    const createdJob = job as ExperienceCreatedEmailJob;
    const experienceLink = buildExperienceFullUrl(createdJob.experienceId);
    return sendResendEmail({
      to: createdJob.recipientEmail,
      from: resendFrom,
      subject: `New experience published: ${createdJob.experienceTitle}`,
      react: ExperienceCreatedEmail({
        recipientName: createdJob.recipientName,
        experienceTitle: createdJob.experienceTitle,
        experienceCategory: createdJob.experienceCategory,
        experienceLink,
      }),
    });
  },
};

export async function processNotificationQueueJob(job: NotificationQueueJob) {
  const resendFrom = getResendFromEmail();
  if (!resendFrom) throw new Error('RESEND_FROM_EMAIL is not configured.');

  // Default to the date-canceled handler as a defensive fallback. In practice
  // valid jobs should always resolve through their explicit type key first.
  const handler =
    notificationHandlers[job.type] ||
    notificationHandlers[NOTIFICATION_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL];
  return handler(job, resendFrom);
}
