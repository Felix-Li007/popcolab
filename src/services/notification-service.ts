import 'server-only';

import { Prisma, MessageType } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { enqueueNotificationQueueJob } from '@/services/queue-service';
import { handleQStashTask, publishQStashTask } from '@/services/qstash-service';
import { NOTIFICATION_QUEUE_JOB_TYPE } from '@/types/queue-job';
import { QSTASH_TASK_TYPE } from '@/types/qstash-task';
import {
  formatLocalDateValue,
  formatScheduleTimeValue,
  parseCalendarDateValue,
} from '@/utils/event-schedule';
import { createModuleLogger } from '@/utils/logging-util';

const logger = createModuleLogger(import.meta.url);

type PurchasedEventRecipient = {
  userId: number;
  email: string;
  name: string;
};

type CancellationRecipient = PurchasedEventRecipient & {
  source: 'purchase' | 'test_fallback';
};

type EventCalendarSnapshot = {
  event_date: Date;
  start_time: Date;
  end_time: Date;
  date_status?: string;
  id?: number;
};

type EventOrderSlot = {
  schedule_date: Date;
  start_time: Date;
  end_time: Date;
};

function buildRecipientName(value: string | null | undefined, email: string) {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return email.split('@')[0]?.trim() || 'there';
}

function buildCalendarKey(calendar: EventCalendarSnapshot) {
  const parsedDate = parseCalendarDateValue(calendar.event_date);
  const startTime = formatScheduleTimeValue(calendar.start_time);
  const endTime = formatScheduleTimeValue(calendar.end_time);

  if (!parsedDate || !startTime || !endTime) {
    return null;
  }

  return `${parsedDate.toISOString()}|${startTime}|${endTime}`;
}

function buildOrderSlotKey(slot: EventOrderSlot) {
  const parsedDate = parseCalendarDateValue(slot.schedule_date);
  const startTime = formatScheduleTimeValue(slot.start_time);
  const endTime = formatScheduleTimeValue(slot.end_time);

  if (!parsedDate || !startTime || !endTime) {
    return null;
  }

  return `${formatLocalDateValue(parsedDate)}|${startTime}:00|${endTime}:00`;
}

function formatCanceledDateLabel(calendar: EventCalendarSnapshot) {
  const parsedDate = parseCalendarDateValue(calendar.event_date);
  if (!parsedDate) return null;

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCanceledTimeLabel(calendar: EventCalendarSnapshot) {
  const startTime = formatScheduleTimeValue(calendar.start_time);
  const endTime = formatScheduleTimeValue(calendar.end_time);

  if (!startTime || !endTime) return null;
  return `${startTime} - ${endTime}`;
}

function getScheduleSlotForOrderItem(calendar: EventCalendarSnapshot) {
  const parsedDate = parseCalendarDateValue(calendar.event_date);
  const startTime = formatScheduleTimeValue(calendar.start_time);
  const endTime = formatScheduleTimeValue(calendar.end_time);

  if (!parsedDate || !startTime || !endTime) return null;

  return {
    schedule_date: parsedDate,
    start_time: calendar.start_time,
    end_time: calendar.end_time,
  } satisfies EventOrderSlot;
}

function formatScheduleStartLabel(slot: EventOrderSlot) {
  const parsedDate = parseCalendarDateValue(slot.schedule_date);
  const startTime = formatScheduleTimeValue(slot.start_time);

  if (!parsedDate || !startTime) {
    return null;
  }

  return `${formatLocalDateValue(parsedDate)} ${startTime}:00`;
}

function describeCalendar(calendar: EventCalendarSnapshot) {
  const parsedDate = parseCalendarDateValue(calendar.event_date);
  const startTime = formatScheduleTimeValue(calendar.start_time);
  const endTime = formatScheduleTimeValue(calendar.end_time);
  const eventDate = parsedDate ? formatLocalDateValue(parsedDate) : null;

  return {
    calendarId: calendar.id ?? null,
    eventDate,
    startTime,
    endTime,
    dateStatus: calendar.date_status ?? null,
    scheduleWindow:
      eventDate && startTime && endTime
        ? `${eventDate} ${startTime}:00-${endTime}:00`
        : null,
  };
}

function getTestCancellationRecipient(): CancellationRecipient | null {
  const fallbackEmail = process.env.EVENT_CANCEL_TEST_RECIPIENT_EMAIL?.trim();
  if (!fallbackEmail) {
    return null;
  }

  return {
    userId: 0,
    email: fallbackEmail.toLowerCase(),
    name: buildRecipientName(undefined, fallbackEmail),
    source: 'test_fallback',
  };
}

async function getPurchasedEventRecipients(params: {
  eventId: number;
  scheduleSlots?: EventOrderSlot[];
}): Promise<PurchasedEventRecipient[]> {
  const scheduleSlotTexts = params.scheduleSlots?.length
    ? params.scheduleSlots
        .map(slot => buildOrderSlotKey(slot))
        .filter((value): value is string => Boolean(value))
    : [];

  const orderItems = await prisma.$queryRaw<
    Array<{
      user_id: number;
      email: string;
      user_name: string | null;
      customer_email: string | null;
    }>
  >(Prisma.sql`
    select distinct
      u.id as user_id,
      u.email as email,
      u.user_name as user_name
    from order_item oi
    inner join "order" o on o.id = oi.order_id
    inner join "user" u on u.id = o.user_id
    where oi.item_type = 'EVENT'
      and oi.event_id = ${params.eventId}
      and o.order_status = 'paid'
      ${
        scheduleSlotTexts.length > 0
          ? Prisma.sql`and (
            to_char(oi.schedule_date, 'YYYY-MM-DD') || '|' ||
            to_char(oi.start_time, 'HH24:MI:SS') || '|' ||
            to_char(oi.end_time, 'HH24:MI:SS')
          ) in (${Prisma.join(scheduleSlotTexts)})`
          : Prisma.empty
      }
  `);

  const deduped = new Map<string, PurchasedEventRecipient>();

  for (const item of orderItems) {
    const email = item.email.trim().toLowerCase();

    if (!email) continue;
    if (deduped.has(email)) continue;

    deduped.set(email, {
      userId: item.user_id,
      email,
      name: buildRecipientName(item.user_name, email),
    });
  }

  return [...deduped.values()];
}

export async function enqueueRequestMatchedNotification(params: {
  userId: number;
  recipientEmail: string;
  recipientName: string;
  requestId: number;
  proposalId: number;
  objectiveCategory: string;
}) {
  await prisma.notification.create({
    data: {
      user_id: params.userId,
      message_type: MessageType.REQUEST_MATCHED,
      message_title: `Request #${params.requestId} matched`,
      message_body:
        'Your request has been approved and is now matched with a proposal.',
      message_data: {
        requestId: params.requestId,
        proposalId: params.proposalId,
        objectiveCategory: params.objectiveCategory,
      },
    },
  });

  await enqueueNotificationQueueJob({
    type: NOTIFICATION_QUEUE_JOB_TYPE.REQUEST_MATCHED_EMAIL,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    requestId: params.requestId,
    objectiveCategory: params.objectiveCategory,
    queuedAt: new Date().toISOString(),
  });

  try {
    await publishQStashTask({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });
  } catch (error) {
    logger.warn(
      {
        error,
        requestId: params.requestId,
        proposalId: params.proposalId,
      },
      'QStash publish failed for request matched notification, processing queue locally'
    );

    await handleQStashTask({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });
  }
}

export async function enqueueEventCanceledNotifications(params: {
  eventId: number;
  eventTitle: string;
  eventLocation: string;
}) {
  logger.debug(
    {
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      eventLocation: params.eventLocation,
    },
    'Event cancellation notification lookup started'
  );

  const purchasedRecipients = await getPurchasedEventRecipients({
    eventId: params.eventId,
  });

  const testRecipient =
    purchasedRecipients.length === 0 ? getTestCancellationRecipient() : null;

  const recipients: CancellationRecipient[] = [
    ...purchasedRecipients.map(recipient => ({
      ...recipient,
      source: 'purchase' as const,
    })),
    ...(testRecipient ? [testRecipient] : []),
  ];

  logger.debug(
    {
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      purchasedRecipientCount: purchasedRecipients.length,
      fallbackRecipientUsed: Boolean(testRecipient),
      recipientCount: recipients.length,
    },
    'Event cancellation recipients resolved'
  );

  if (recipients.length === 0) {
    logger.warn(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
      },
      'No recipients found for event cancellation notifications'
    );
    return {
      recipientCount: 0,
      queuedCount: 0,
    };
  }

  const persistedRecipients = recipients.filter(
    recipient => recipient.source === 'purchase'
  );

  if (persistedRecipients.length > 0) {
    await prisma.notification.createMany({
      data: persistedRecipients.map(recipient => ({
        user_id: recipient.userId,
        message_type: MessageType.EVENT_CANCELED,
        message_title: `Event canceled: ${params.eventTitle}`,
        message_body: `${params.eventTitle} at ${params.eventLocation} has been canceled.`,
        message_data: {
          eventId: params.eventId,
          eventTitle: params.eventTitle,
          eventLocation: params.eventLocation,
          cancellationType: 'event',
        },
      })),
    });

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        notificationCount: persistedRecipients.length,
      },
      'Event cancellation notifications created'
    );
  } else {
    logger.warn(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
      },
      'Skipping database notification records because only fallback recipients are being used'
    );
  }

  await Promise.all(
    recipients.map(recipient =>
      enqueueNotificationQueueJob({
        type: NOTIFICATION_QUEUE_JOB_TYPE.EVENT_CANCELED_EMAIL,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        eventTitle: params.eventTitle,
        eventLocation: params.eventLocation,
        queuedAt: new Date().toISOString(),
      })
    )
  );

  logger.debug(
    {
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      queuedCount: recipients.length,
      fallbackRecipientUsed: Boolean(testRecipient),
    },
    'Event cancellation email jobs queued'
  );

  try {
    await publishQStashTask({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        batchSize: 100,
      },
      'Notification queue process task published'
    );
  } catch (error) {
    logger.warn(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        error,
      },
      'QStash publish failed, processing cancellation queue locally'
    );

    await handleQStashTask({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        batchSize: 100,
      },
      'Notification queue processed locally after publish failure'
    );
  }

  return {
    recipientCount: recipients.length,
    queuedCount: recipients.length,
  };
}

export async function enqueueEventDateCanceledNotifications(params: {
  eventId: number;
  eventTitle: string;
  eventLocation: string;
  canceledCalendars: EventCalendarSnapshot[];
}) {
  logger.debug(
    {
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      eventLocation: params.eventLocation,
      canceledCalendarCount: params.canceledCalendars.length,
    },
    'Event date cancellation notification lookup started'
  );

  let recipientCount = 0;
  let queuedCount = 0;

  for (const calendar of params.canceledCalendars) {
    const calendarInfo = describeCalendar(calendar);

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        calendar: calendarInfo,
      },
      'Evaluating canceled event date'
    );

    const scheduleSlot = getScheduleSlotForOrderItem(calendar);
    const canceledDateLabel = formatCanceledDateLabel(calendar);
    const canceledTimeLabel = formatCanceledTimeLabel(calendar);

    if (!scheduleSlot || !canceledDateLabel) {
      logger.warn(
        {
          eventId: params.eventId,
          eventTitle: params.eventTitle,
          calendar: calendarInfo,
          scheduleSlot,
          canceledDateLabel,
        },
        'Skipping canceled event date because schedule information is incomplete'
      );

      continue;
    }

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        calendar: calendarInfo,
        scheduleDate: formatScheduleStartLabel(scheduleSlot),
        canceledDateLabel,
        canceledTimeLabel,
      },
      'Resolved canceled event date labels'
    );

    const recipients = await getPurchasedEventRecipients({
      eventId: params.eventId,
      scheduleSlots: [scheduleSlot],
    });

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        scheduleDate: formatScheduleStartLabel(scheduleSlot),
        recipientCount: recipients.length,
      },
      'Resolved recipients for canceled event date'
    );

    if (recipients.length === 0) {
      logger.warn(
        {
          eventId: params.eventId,
          eventTitle: params.eventTitle,
          calendar: calendarInfo,
          scheduleDate: formatScheduleStartLabel(scheduleSlot),
        },
        'No recipients found for event date cancellation notifications'
      );
      continue;
    }

    recipientCount += recipients.length;

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        scheduleDate: formatScheduleStartLabel(scheduleSlot),
        notificationCount: recipients.length,
      },
      'Creating event date cancellation notifications'
    );

    await prisma.notification.createMany({
      data: recipients.map(recipient => ({
        user_id: recipient.userId,
        message_type: MessageType.DATE_CANCELED,
        message_title: `Event date canceled: ${params.eventTitle}`,
        message_body: `${params.eventTitle} on ${canceledDateLabel}${canceledTimeLabel ? ` ${canceledTimeLabel}` : ''} has been canceled.`,
        message_data: {
          eventId: params.eventId,
          eventTitle: params.eventTitle,
          eventLocation: params.eventLocation,
          cancellationType: 'date',
          canceledDateLabel,
          canceledTimeLabel,
        },
      })),
    });

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        scheduleDate: formatScheduleStartLabel(scheduleSlot),
        notificationCount: recipients.length,
      },
      'Event date cancellation notifications created'
    );

    await Promise.all(
      recipients.map(recipient =>
        enqueueNotificationQueueJob({
          type: NOTIFICATION_QUEUE_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          eventTitle: params.eventTitle,
          eventLocation: params.eventLocation,
          canceledDateLabel,
          canceledTimeLabel,
          queuedAt: new Date().toISOString(),
        })
      )
    );

    queuedCount += recipients.length;

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        scheduleDate: formatScheduleStartLabel(scheduleSlot),
        queuedCount: recipients.length,
      },
      'Event date cancellation email jobs queued'
    );
  }

  if (queuedCount === 0) {
    logger.warn(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
      },
      'No event date cancellation email jobs were queued'
    );

    return {
      recipientCount: 0,
      queuedCount: 0,
    };
  }

  logger.debug(
    {
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      queuedCount,
    },
    'Publishing notification queue process task'
  );

  try {
    await publishQStashTask({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });
  } catch (error) {
    logger.warn(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        error,
      },
      'QStash publish failed for date cancellation, processing queue locally'
    );

    await handleQStashTask({
      type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
      batchSize: 100,
    });

    logger.debug(
      {
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        batchSize: 100,
      },
      'Date cancellation queue processed locally after publish failure'
    );
  }

  logger.debug(
    {
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      recipientCount,
      queuedCount,
    },
    'Event date cancellation notification flow completed'
  );

  return {
    recipientCount,
    queuedCount,
  };
}

export function getRemovedEventCalendars(params: {
  previousCalendars: EventCalendarSnapshot[];
  nextCalendars: Array<{
    eventDate: string;
    startTime: string;
    endTime: string;
  }>;
}): EventCalendarSnapshot[] {
  const nextCalendarKeys = new Set(
    params.nextCalendars
      .map(calendar => {
        const parsedDate = parseCalendarDateValue(calendar.eventDate);
        if (!parsedDate || !calendar.startTime || !calendar.endTime) {
          return null;
        }

        return `${parsedDate.toISOString()}|${calendar.startTime}|${calendar.endTime}`;
      })
      .filter((value): value is string => Boolean(value))
  );

  return params.previousCalendars.filter(calendar => {
    const key = buildCalendarKey(calendar);
    return key ? !nextCalendarKeys.has(key) : false;
  });
}
