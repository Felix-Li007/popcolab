import 'server-only';

import { Prisma, MessageType } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import {
  getRequestStatusLabel,
  toRequestStatus,
} from '@/constants/request-status';
import { enqueueNotificationQueueJob } from '@/services/queue-service';
import { publishQStashTask } from '@/services/qstash-service';
import { NOTIFICATION_JOB_TYPE, NotificationQueueJob } from '@/types/queue-job';
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

  return `${formatLocalDateValue(parsedDate)}|${startTime}|${endTime}`;
}

function buildDraftCalendarKey(calendar: {
  eventDate: string;
  startTime: string;
  endTime: string;
}) {
  const parsedDate = parseCalendarDateValue(calendar.eventDate);
  const startTime = formatScheduleTimeValue(calendar.startTime);
  const endTime = formatScheduleTimeValue(calendar.endTime);

  if (!parsedDate || !startTime || !endTime) {
    return null;
  }

  return `${formatLocalDateValue(parsedDate)}|${startTime}|${endTime}`;
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
      and o.order_status = 'PAID'
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

type RecipientWithOptionalId = { userId?: number; email: string; name: string };

abstract class NotificationFlow<TRecipient extends RecipientWithOptionalId> {
  protected readonly PAGE_SIZE: number;
  protected messageType!: MessageType;
  protected messageTitle!: (r: TRecipient) => string;
  protected messageBody!: (r: TRecipient) => string;
  protected messageData!: (
    r: TRecipient
  ) => Prisma.InputJsonValue | typeof Prisma.DbNull | typeof Prisma.JsonNull;
  protected queueJobType!: NotificationQueueJob['type'];
  protected queueJobPayload!: (r: TRecipient) => Record<string, unknown>;

  constructor(pageSize = 500) {
    this.PAGE_SIZE = pageSize;
  }

  protected abstract fetchRecipient(page: number): Promise<TRecipient[]>;

  async run(): Promise<{ recipientCount: number; queuedCount: number }> {
    let recipientCount = 0;
    let queuedCount = 0;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const recipients = await this.fetchRecipient(page);
      if (!recipients || recipients.length === 0) break;

      recipientCount += recipients.length;

      const toPersist = recipients.filter(
        r => typeof r.userId === 'number' && r.userId! > 0
      );

      if (toPersist.length > 0) {
        await prisma.notification.createMany({
          data: toPersist.map(r => ({
            user_id: r.userId!,
            message_type: this.messageType,
            message_title: this.messageTitle(r),
            message_body: this.messageBody(r),
            message_data: (() => {
              if (!this.messageData) return Prisma.DbNull;
              const val = this.messageData(r);
              return val === null || val === undefined ? Prisma.DbNull : val;
            })(),
          })),
        });
      }

      await Promise.all(
        recipients.map(r =>
          enqueueNotificationQueueJob({
            type: this.queueJobType,
            recipientEmail: r.email,
            recipientName: r.name,
            queuedAt: new Date().toISOString(),
            ...this.queueJobPayload(r),
          } as NotificationQueueJob)
        )
      );

      queuedCount += recipients.length;
      hasMore = recipients.length === this.PAGE_SIZE;
      page++;
    }

    if (queuedCount === 0) {
      return { recipientCount: 0, queuedCount: 0 };
    }

    try {
      await publishQStashTask({
        type: QSTASH_TASK_TYPE.NOTIFICATION_QUEUE_PROCESS,
        batchSize: 100,
      });
    } catch (error) {
      logger.error(
        { error },
        'QStash publish failed, notifications not processed'
      );
    }

    return { recipientCount, queuedCount };
  }
}

class ExperienceCreatedFlow extends NotificationFlow<RecipientWithOptionalId> {
  constructor(
    private params: {
      experienceId: number;
      experienceTitle: string;
      experienceCategory: string;
    }
  ) {
    super(500);
    this.messageType = MessageType.EXPERIENCE_CREATED;
    this.messageTitle = () =>
      `New experience published: ${this.params.experienceTitle}`;
    this.messageBody = () =>
      `${this.params.experienceTitle} has been published.`;
    this.messageData = () => ({
      experienceId: this.params.experienceId,
      experienceTitle: this.params.experienceTitle,
      experienceCategory: this.params.experienceCategory,
      creationType: 'experience',
    });
    this.queueJobType = NOTIFICATION_JOB_TYPE.EXPERIENCE_CREATED_EMAIL;
    this.queueJobPayload = () => ({
      experienceTitle: this.params.experienceTitle,
      experienceCategory: this.params.experienceCategory,
      experienceId: this.params.experienceId,
    });
  }

  protected async fetchRecipient(page: number) {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, user_name: true },
      skip: page * this.PAGE_SIZE,
      take: this.PAGE_SIZE,
      orderBy: { id: 'asc' },
    });

    return users.map(u => ({
      userId: u.id,
      email: u.email,
      name: buildRecipientName(u.user_name, u.email),
    }));
  }
}
export async function enqueueExperienceCreatedNotifications(params: {
  experienceId: number;
  experienceTitle: string;
  experienceCategory: string;
}) {
  return await new ExperienceCreatedFlow(params).run();
}

class EventCreatedFlow extends NotificationFlow<RecipientWithOptionalId> {
  constructor(
    private params: {
      eventId: number;
      eventTitle: string;
      eventLocation: string;
    }
  ) {
    super(500);
    this.messageType = MessageType.EVENT_CREATED;
    this.messageTitle = () => `New event created: ${this.params.eventTitle}`;
    this.messageBody = () => `${this.params.eventTitle} has been created.`;
    this.messageData = () => ({
      eventId: this.params.eventId,
      eventTitle: this.params.eventTitle,
      eventLocation: this.params.eventLocation,
      creationType: 'event',
    });
    this.queueJobType = NOTIFICATION_JOB_TYPE.EVENT_CREATED_EMAIL;
    this.queueJobPayload = () => ({
      eventId: this.params.eventId,
      eventTitle: this.params.eventTitle,
      eventLocation: this.params.eventLocation,
    });
  }

  protected async fetchRecipient(page: number) {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, user_name: true },
      skip: page * this.PAGE_SIZE,
      take: this.PAGE_SIZE,
      orderBy: { id: 'asc' },
    });

    return users.map(u => ({
      userId: u.id,
      email: u.email,
      name: buildRecipientName(u.user_name, u.email),
    }));
  }
}

class EventCanceledFlow extends NotificationFlow<RecipientWithOptionalId> {
  constructor(
    private params: {
      eventId: number;
      eventTitle: string;
      eventLocation: string;
    }
  ) {
    super(500);
    this.messageType = MessageType.EVENT_CANCELED;
    this.messageTitle = () => `Event canceled: ${this.params.eventTitle}`;
    this.messageBody = () =>
      `${this.params.eventTitle} at ${this.params.eventLocation} has been canceled.`;
    this.messageData = () => ({
      eventId: this.params.eventId,
      eventTitle: this.params.eventTitle,
      eventLocation: this.params.eventLocation,
      cancellationType: 'event',
    });
    this.queueJobType = NOTIFICATION_JOB_TYPE.EVENT_CANCELED_EMAIL;
    this.queueJobPayload = () => ({
      eventId: this.params.eventId,
      eventTitle: this.params.eventTitle,
      eventLocation: this.params.eventLocation,
    });
  }

  protected async fetchRecipient(page: number) {
    const rows = await prisma.$queryRaw<
      Array<{ user_id: number; email: string; user_name: string | null }>
    >(Prisma.sql`
      select distinct
        u.id as user_id,
        u.email as email,
        u.user_name as user_name
      from order_item oi
      inner join "order" o on o.id = oi.order_id
      inner join "user" u on u.id = o.user_id
      where oi.item_type = 'EVENT'
        and oi.event_id = ${this.params.eventId}
        and o.order_status = 'PAID'
      order by u.id asc
      offset ${page * this.PAGE_SIZE} limit ${this.PAGE_SIZE}
    `);

    if (rows.length === 0 && page === 0) {
      const fallback = getTestCancellationRecipient();
      if (fallback) return [fallback];
    }

    return rows.map(r => ({
      userId: r.user_id,
      email: r.email,
      name: buildRecipientName(r.user_name, r.email),
    }));
  }
}

class DateCanceledFlow extends NotificationFlow<
  RecipientWithOptionalId & {
    calendar: EventCalendarSnapshot;
    canceledDateLabel: string;
    canceledTimeLabel: string | null;
  }
> {
  private calendars: EventCalendarSnapshot[];
  constructor(
    calendars: EventCalendarSnapshot[],
    private params: {
      eventId: number;
      eventTitle: string;
      eventLocation: string;
    }
  ) {
    super(500);
    this.calendars = calendars;
    this.messageType = MessageType.DATE_CANCELED;
    this.messageTitle = () => `Event date canceled: ${params.eventTitle}`;
    this.messageBody = r =>
      `${params.eventTitle} on ${r.canceledDateLabel}${r.canceledTimeLabel ? ` ${r.canceledTimeLabel}` : ''} has been canceled.`;
    this.messageData = r => ({
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      eventLocation: params.eventLocation,
      cancellationType: 'date',
      canceledDateLabel: r.canceledDateLabel,
      canceledTimeLabel: r.canceledTimeLabel,
    });
    this.queueJobType = NOTIFICATION_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL;
    this.queueJobPayload = r => ({
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      eventLocation: params.eventLocation,
      canceledDateLabel: r.canceledDateLabel,
      canceledTimeLabel: r.canceledTimeLabel,
    });
  }

  protected async fetchRecipient(page: number) {
    // Each page is a calendar slot
    if (page >= this.calendars.length) return [];
    const calendar = this.calendars[page];
    const scheduleSlot = getScheduleSlotForOrderItem(calendar);
    const canceledDateLabel = formatCanceledDateLabel(calendar);
    const canceledTimeLabel = formatCanceledTimeLabel(calendar);
    if (!scheduleSlot || !canceledDateLabel) return [];
    const recipients = await getPurchasedEventRecipients({
      eventId: this.params.eventId,
      scheduleSlots: [scheduleSlot],
    });
    return recipients.map(r => ({
      ...r,
      calendar,
      canceledDateLabel,
      canceledTimeLabel,
    }));
  }
}

function formatRequestStatusForMessage(value: string | null) {
  const status = value ? toRequestStatus(value) : null;
  return getRequestStatusLabel(status) ?? value?.toUpperCase() ?? null;
}

type RequestChangedRecipient = RecipientWithOptionalId & {
  objectiveCategory: string;
  proposalId: number;
};

class RequestChangedFlow extends NotificationFlow<RequestChangedRecipient> {
  constructor(
    private params: {
      requestId: number;
      previousStatus: string | null;
      nextStatus: string;
    }
  ) {
    super(1); // Only one recipient
    const previousStatusLabel = formatRequestStatusForMessage(
      params.previousStatus
    );
    const nextStatusLabel =
      formatRequestStatusForMessage(params.nextStatus) ?? params.nextStatus;

    this.messageType = MessageType.REQUEST_CHANGED;
    this.messageTitle = () =>
      `Request #${params.requestId} status changed to ${params.nextStatus}`;
    this.messageBody = () =>
      previousStatusLabel
        ? `Your request status changed from ${previousStatusLabel} to ${nextStatusLabel}.`
        : `Your request status changed to ${nextStatusLabel}.`;
    this.messageData = r => ({
      requestId: params.requestId,
      proposalId: r.proposalId,
      objectiveCategory: r.objectiveCategory,
      previousStatus: params.previousStatus,
      nextStatus: params.nextStatus,
    });
    this.queueJobType = NOTIFICATION_JOB_TYPE.REQUEST_CHANGED_EMAIL;
    this.queueJobPayload = r => ({
      requestId: params.requestId,
      objectiveCategory: r.objectiveCategory,
      previousStatus: params.previousStatus,
      nextStatus: params.nextStatus,
    });
  }

  protected async fetchRecipient(page: number) {
    if (page > 0) return [];
    const request = await prisma.request.findUnique({
      where: { id: this.params.requestId },
      select: {
        id: true,
        objective_category: true,
        user: {
          select: {
            id: true,
            email: true,
            user_name: true,
          },
        },
        proposals: {
          orderBy: [{ id: 'desc' }],
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!request?.user?.email) {
      return [];
    }

    return [
      {
        userId: request.user.id,
        email: request.user.email,
        name: buildRecipientName(request.user.user_name, request.user.email),
        objectiveCategory: request.objective_category,
        proposalId: request.proposals[0]?.id ?? 0,
      },
    ];
  }
}

export async function enqueueRequestChangedNotification(params: {
  requestId: number;
  previousStatus: string | null;
  nextStatus: string;
}) {
  return await new RequestChangedFlow(params).run();
}

export async function enqueueEventCanceledNotifications(params: {
  eventId: number;
  eventTitle: string;
  eventLocation: string;
}) {
  const flow = new EventCanceledFlow(params);
  const result = await flow.run();
  return result;
}

export async function enqueueDateCanceledNotifications(params: {
  eventId: number;
  eventTitle: string;
  eventLocation: string;
  canceledCalendars: EventCalendarSnapshot[];
}) {
  const flow = new DateCanceledFlow(params.canceledCalendars, params);
  const result = await flow.run();

  if (result.queuedCount === 0) {
    return {
      recipientCount: 0,
      queuedCount: 0,
    };
  }
  return result;
}

export async function enqueueEventCreatedNotifications(params: {
  eventId: number;
  eventTitle: string;
  eventLocation: string;
}) {
  return await new EventCreatedFlow(params).run();
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
      .map(calendar => buildDraftCalendarKey(calendar))
      .filter((value): value is string => Boolean(value))
  );

  return params.previousCalendars.filter(calendar => {
    const key = buildCalendarKey(calendar);
    return key ? !nextCalendarKeys.has(key) : false;
  });
}
