import 'server-only';

import { EventCancellationEmail } from '@/emails/templates/event-cancel-template';
import { RequestMatchedEmail } from '@/emails/templates/request-matched-template';
import { sendResendEmail } from '@/services/resend-service';
import {
  NOTIFICATION_QUEUE_JOB_TYPE,
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

function buildRequestMatchedSubject(requestId: number) {
  return `Request #${requestId} approved and matched`;
}

export async function processNotificationQueueJob(job: NotificationQueueJob) {
  const resendFrom = getResendFromEmail();
  if (!resendFrom) {
    throw new Error('RESEND_FROM_EMAIL is not configured.');
  }

  logger.info(
    {
      jobType: job.type,
      recipientEmail: job.recipientEmail,
    },
    'Processing notification queue job'
  );

  if (job.type === NOTIFICATION_QUEUE_JOB_TYPE.EVENT_CANCELED_EMAIL) {
    const result = await sendResendEmail({
      to: job.recipientEmail,
      from: resendFrom,
      subject: buildEventCanceledSubject(job.eventTitle),
      react: EventCancellationEmail({
        recipientName: job.recipientName,
        eventTitle: job.eventTitle,
        eventLocation: job.eventLocation,
        cancellationType: 'event',
      }),
    });

    logger.info(
      {
        jobType: job.type,
        recipientEmail: job.recipientEmail,
        resendMessageId: result.id,
      },
      'Event cancellation email sent'
    );

    return result;
  }

  console.log('Job type:', job.type);
  if (job.type === NOTIFICATION_QUEUE_JOB_TYPE.REQUEST_MATCHED_EMAIL) {
    const result = await sendResendEmail({
      to: job.recipientEmail,
      from: resendFrom,
      subject: buildRequestMatchedSubject(job.requestId),
      react: RequestMatchedEmail({
        recipientName: job.recipientName,
        requestId: job.requestId,
        objectiveCategory: job.objectiveCategory,
      }),
    });

    logger.info(
      {
        jobType: job.type,
        recipientEmail: job.recipientEmail,
        resendMessageId: result.id,
      },
      'Request matched email sent'
    );

    return result;
  }

  const result = await sendResendEmail({
    to: job.recipientEmail,
    from: resendFrom,
    subject: buildEventDateCanceledSubject(job.eventTitle),
    react: EventCancellationEmail({
      recipientName: job.recipientName,
      eventTitle: job.eventTitle,
      eventLocation: job.eventLocation,
      cancellationType: 'date',
      canceledDateLabel: job.canceledDateLabel,
      canceledTimeLabel: job.canceledTimeLabel,
    }),
  });

  logger.info(
    {
      jobType: job.type,
      recipientEmail: job.recipientEmail,
      resendMessageId: result.id,
    },
    'Event date cancellation email sent'
  );

  return result;
}
