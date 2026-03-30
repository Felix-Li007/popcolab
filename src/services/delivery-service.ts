import 'server-only';

import { EventCancellationEmail } from '@/emails/templates/event-cancel-template';
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

export async function processNotificationQueueJob(job: NotificationQueueJob) {
  const resendFrom = getResendFromEmail();
  if (!resendFrom) {
    throw new Error('RESEND_FROM_EMAIL is not configured.');
  }

  logger.info(
    {
      jobType: job.type,
      recipientEmail: job.recipientEmail,
      eventTitle: job.eventTitle,
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
