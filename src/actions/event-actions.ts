'use server';

import { DateStatus, EventStatus } from '@/libs/prisma/enums';
import { prisma } from '@/libs/prisma-client';
import { revalidatePath } from 'next/cache';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  Event,
  EventFormState,
  EventGalleryInput,
} from '@/types/event-type';
import {
  getCurrentDbUserId,
  requireAdminActionAccess,
} from '@/services/clerk-service';
import {
  enqueueEventDateCanceledNotifications,
  getRemovedEventCalendars,
} from '@/services/notification-service';
import { serializeEvent } from '@/services/event-service';
import { sanitizeRichTextHtml } from '@/utils/html-sanitizer';
import { createModuleLogger } from '@/utils/logging-util';
import { EVENT_CANCEL_MIN_LEAD_DAYS } from '@/constants/event-config';
import {
  parseDateInputValue,
  formatDateForPrismaDateField,
  formatTimeForPrismaTimeField,
  formatScheduleTimeValue,
  isAtLeastDaysAway,
  mergeDateAndTime,
  parseCalendarDateValue,
} from '@/utils/event-schedule';

const uploadDirectorySetting =
  process.env.EVENT_GALLERY_UPLOAD_DIR ?? 'public/images/events';
const publicPathSetting =
  process.env.EVENT_GALLERY_PUBLIC_PATH ?? '/images/events';

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), uploadDirectorySetting);
const PUBLIC_PATH_PREFIX = publicPathSetting.startsWith('/')
  ? publicPathSetting.replace(/\/+$/, '')
  : `/${publicPathSetting.replace(/\/+$/, '')}`;
const logger = createModuleLogger(import.meta.url);

function getFileExtension(fileName: string, mimeType: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext) return ext;

  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/jpeg':
    default:
      return '.jpg';
  }
}

type CreateEventActionData = EventFormState & {
  eventCalendars?: Array<{
    eventDate: string;
    startTime: string;
    endTime: string;
  }>;
  eventGalleries?: EventGalleryInput[];
  eventPricings?: Array<{
    priceLevel: 'ADULT' | 'SENIOR' | 'YOUTH' | 'CHILD';
    eventPrice: string;
  }>;
};

type UpdateEventActionData = Partial<EventFormState> & {
  eventCalendars?: Array<{
    eventDate: string;
    startTime: string;
    endTime: string;
  }>;
  eventGalleries?: EventGalleryInput[];
  eventPricings?: Array<{
    priceLevel: 'ADULT' | 'SENIOR' | 'YOUTH' | 'CHILD';
    eventPrice: string;
  }>;
};

type BookingInput = {
  eventId: number;
  calendarId: number;
  quantity: number;
  total: number;
  tickets: Array<{
    priceId: number;
    qty: number;
  }>;
};

function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getActiveEventCalendars<
  T extends {
    date_status?: string;
  },
>(calendars: T[]) {
  return calendars.filter(
    calendar => calendar.date_status !== DateStatus.CANCELLED
  );
}

function getCalendarStartDateTime(calendar: {
  event_date: Date;
  start_time: Date;
}) {
  const eventDate = parseCalendarDateValue(calendar.event_date);
  const startTime = formatScheduleTimeValue(calendar.start_time);
  if (!eventDate || !startTime) return null;
  return mergeDateAndTime(eventDate, startTime);
}

function canCancelCalendar(calendar: { event_date: Date; start_time: Date }) {
  const startDateTime = getCalendarStartDateTime(calendar);
  if (!startDateTime) return false;
  return isAtLeastDaysAway(startDateTime, EVENT_CANCEL_MIN_LEAD_DAYS);
}

export async function uploadEventGalleryImageAction(formData: FormData) {
  try {
    await requireAdminActionAccess();

    const file = formData.get('file');

    if (!(file instanceof File)) {
      return { success: false, error: 'No image file was provided' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Only image uploads are supported' };
    }

    await mkdir(UPLOAD_DIRECTORY, { recursive: true });

    const extension = getFileExtension(file.name, file.type);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const absoluteFilePath = path.join(UPLOAD_DIRECTORY, fileName);
    const relativeUrl = `${PUBLIC_PATH_PREFIX}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(absoluteFilePath, buffer);

    return { success: true, relativeUrl };
  } catch (error) {
    console.error('Failed to upload event gallery image:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to upload image' };
  }
}

export async function createEventAction(
  data: CreateEventActionData
): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    await requireAdminActionAccess();

    const createdBy = await getCurrentDbUserId();
    if (!createdBy) {
      return { success: false, error: 'Authentication required' };
    }

    const sanitizedContentHtml = sanitizeRichTextHtml(data.contentHtml);
    const eventCalendarCreate =
      data.eventCalendars && data.eventCalendars.length > 0
        ? {
            create: data.eventCalendars.map(schedule => {
              const parsedDate = parseDateInputValue(schedule.eventDate);
              if (!parsedDate) throw new Error('Invalid event schedule');

              const startTime = formatTimeForPrismaTimeField(
                schedule.startTime
              );
              const endTime = formatTimeForPrismaTimeField(schedule.endTime);

              if (!startTime || !endTime) {
                throw new Error('Invalid event schedule');
              }

              return {
                event_date: formatDateForPrismaDateField(parsedDate),
                start_time: startTime,
                end_time: endTime,
                date_status: DateStatus.VALID,
              };
            }),
          }
        : undefined;

    const eventGalleryCreate =
      data.eventGalleries && data.eventGalleries.length > 0
        ? {
            create: data.eventGalleries.map(gallery => ({
              image_url: gallery.imageUrl,
              image_alt: gallery.imageAlt ?? null,
              image_notes: gallery.imageNotes ?? null,
              is_cover: gallery.isCover,
            })),
          }
        : undefined;

    const eventPricingCreate =
      data.eventPricings && data.eventPricings.length > 0
        ? {
            create: data.eventPricings.map(pricing => ({
              price_level: pricing.priceLevel,
              event_price: pricing.eventPrice,
            })),
          }
        : undefined;

    const event = await prisma.event.create({
      data: {
        eventTitle: data.eventTitle,
        eventLocation: data.eventLocation,
        eventNotes: data.eventNotes || null,
        contentHtml: sanitizedContentHtml || null,
        eventStatus: data.eventStatus,
        capacity_max: data.capacity_max,
        createdBy,
        ...(eventCalendarCreate && {
          event_calendars: eventCalendarCreate,
        }),
        ...(eventGalleryCreate && {
          event_galleries: eventGalleryCreate,
        }),
        ...(eventPricingCreate && {
          event_pricing: eventPricingCreate,
        }),
      },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });

    revalidatePath('/admin/events');
    return { success: true, data: serializeEvent(event) };
  } catch (error) {
    console.error('Error creating event:', error);
    if (error instanceof Error && error.message === 'Invalid event schedule') {
      return { success: false, error: 'Invalid event schedule' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create event' };
  }
}

export async function updateEventAction(
  id: number,
  data: UpdateEventActionData
): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    await requireAdminActionAccess();

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        eventTitle: true,
        eventLocation: true,
        eventStatus: true,
        event_calendars: {
          select: {
            id: true,
            event_date: true,
            start_time: true,
            end_time: true,
            date_status: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return { success: false, error: 'Event not found' };
    }

    const sanitizedContentHtml =
      data.contentHtml !== undefined
        ? sanitizeRichTextHtml(data.contentHtml)
        : undefined;
    const eventCalendarUpdate =
      data.eventCalendars !== undefined
        ? {
            deleteMany: {},
            create: data.eventCalendars.map(schedule => {
              const parsedDate = parseDateInputValue(schedule.eventDate);
              if (!parsedDate) throw new Error('Invalid event schedule');

              const startTime = formatTimeForPrismaTimeField(
                schedule.startTime
              );
              const endTime = formatTimeForPrismaTimeField(schedule.endTime);

              if (!startTime || !endTime) {
                throw new Error('Invalid event schedule');
              }

              return {
                event_date: formatDateForPrismaDateField(parsedDate),
                start_time: startTime,
                end_time: endTime,
                date_status: DateStatus.VALID,
              };
            }),
          }
        : undefined;

    const removedCalendars =
      data.eventCalendars !== undefined
        ? getRemovedEventCalendars({
            previousCalendars: getActiveEventCalendars(
              existingEvent.event_calendars
            ),
            nextCalendars: data.eventCalendars,
          })
        : [];

    if (
      data.eventStatus === EventStatus.INACTIVE &&
      existingEvent.eventStatus !== EventStatus.INACTIVE
    ) {
      return {
        success: false,
        error:
          'Use the dedicated cancel event action to cancel all event dates.',
      };
    }

    if (removedCalendars.length > 0) {
      return {
        success: false,
        error:
          'Use the dedicated cancel date action to cancel a specific event date.',
      };
    }

    const eventGalleryUpdate =
      data.eventGalleries !== undefined
        ? {
            deleteMany: {},
            create: data.eventGalleries.map(gallery => ({
              image_url: gallery.imageUrl,
              image_alt: gallery.imageAlt ?? null,
              image_notes: gallery.imageNotes ?? null,
              is_cover: gallery.isCover,
            })),
          }
        : undefined;

    const eventPricingUpdate =
      data.eventPricings !== undefined
        ? {
            deleteMany: {},
            create: data.eventPricings.map(pricing => ({
              price_level: pricing.priceLevel,
              event_price: pricing.eventPrice,
            })),
          }
        : undefined;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(data.eventTitle && { eventTitle: data.eventTitle }),
        ...(data.eventLocation && { eventLocation: data.eventLocation }),
        ...(data.eventNotes !== undefined && { eventNotes: data.eventNotes }),
        ...(data.contentHtml !== undefined && {
          contentHtml: sanitizedContentHtml || null,
        }),
        ...(data.eventStatus && { eventStatus: data.eventStatus }),
        ...(data.capacity_max !== undefined && {
          capacity_max: data.capacity_max,
        }),
        ...(eventCalendarUpdate && {
          event_calendars: eventCalendarUpdate,
        }),
        ...(eventGalleryUpdate && {
          event_galleries: eventGalleryUpdate,
        }),
        ...(eventPricingUpdate && {
          event_pricing: eventPricingUpdate,
        }),
      },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });

    revalidatePath('/admin/events');
    return { success: true, data: serializeEvent(event) };
  } catch (error) {
    console.error('Error updating event:', error);
    if (error instanceof Error && error.message === 'Invalid event schedule') {
      return { success: false, error: 'Invalid event schedule' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update event' };
  }
}

export async function deleteEventAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminActionAccess();

    // Delete related records first
    await Promise.all([
      prisma.eventGallery.deleteMany({ where: { event_id: id } }),
      prisma.eventCalendar.deleteMany({ where: { event_id: id } }),
      prisma.eventPricing.deleteMany({ where: { event_id: id } }),
    ]);

    // Delete the event
    await prisma.event.delete({ where: { id } });

    revalidatePath('/admin/events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete event' };
  }
}

export async function cancelEventAction(
  id: number
): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    logger.info({ eventId: id }, 'Cancel event request started');
    await requireAdminActionAccess();

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        eventTitle: true,
        eventLocation: true,
        eventStatus: true,
        event_calendars: {
          select: {
            id: true,
            event_date: true,
            start_time: true,
            end_time: true,
            date_status: true,
          },
        },
      },
    });

    if (!existingEvent) {
      logger.warn(
        { eventId: id },
        'Cancel event request skipped: event not found'
      );
      return { success: false, error: 'Event not found' };
    }

    const activeCalendars = getActiveEventCalendars(
      existingEvent.event_calendars
    );
    logger.info(
      {
        eventId: existingEvent.id,
        eventTitle: existingEvent.eventTitle,
        activeCalendarCount: activeCalendars.length,
      },
      'Cancel event request validated'
    );

    if (activeCalendars.length === 0) {
      logger.warn(
        { eventId: existingEvent.id, eventTitle: existingEvent.eventTitle },
        'Cancel event request blocked: no active dates'
      );
      return {
        success: false,
        error: 'No active event dates are available to cancel.',
      };
    }

    const earliestActiveCalendar = [...activeCalendars].sort((left, right) => {
      const leftStart =
        getCalendarStartDateTime(left)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightStart =
        getCalendarStartDateTime(right)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftStart - rightStart;
    })[0];

    if (!earliestActiveCalendar || !canCancelCalendar(earliestActiveCalendar)) {
      logger.warn(
        {
          eventId: existingEvent.id,
          eventTitle: existingEvent.eventTitle,
        },
        'Cancel event request blocked: minimum lead time not met'
      );
      return {
        success: false,
        error: `Events can only be canceled at least ${EVENT_CANCEL_MIN_LEAD_DAYS} days before the first scheduled start time.`,
      };
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        eventStatus: EventStatus.INACTIVE,
        event_calendars: {
          updateMany: {
            where: {
              date_status: DateStatus.VALID,
            },
            data: {
              date_status: DateStatus.CANCELLED,
            },
          },
        },
      },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });

    logger.info(
      {
        eventId: event.id,
        eventTitle: event.eventTitle,
        eventStatus: event.eventStatus,
      },
      'Event canceled in database'
    );

    try {
      const notificationResult = await enqueueEventDateCanceledNotifications({
        eventId: existingEvent.id,
        eventTitle: event.eventTitle,
        eventLocation: event.eventLocation,
        canceledCalendars: activeCalendars,
      });
      logger.info(
        {
          eventId: event.id,
          eventTitle: event.eventTitle,
          notificationResult,
        },
        'Event cancellation notifications queued'
      );
    } catch (notificationError) {
      console.error(
        'Failed to send event cancellation notifications:',
        notificationError
      );
    }

    revalidatePath('/admin/events');
    revalidatePath(`/admin/events/${id}`);
    logger.info(
      { eventId: event.id, eventTitle: event.eventTitle },
      'Cancel event request completed'
    );
    return { success: true, data: serializeEvent(event) };
  } catch (error) {
    console.error('Error canceling event:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to cancel event' };
  }
}

export async function cancelEventCalendarAction(
  eventId: number,
  calendarId: number
): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    logger.info(
      {
        eventId,
        calendarId,
      },
      'Cancel event date request started'
    );

    await requireAdminActionAccess();

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventTitle: true,
        eventLocation: true,
        event_calendars: {
          select: {
            id: true,
            event_date: true,
            start_time: true,
            end_time: true,
            date_status: true,
          },
        },
      },
    });

    if (!existingEvent) {
      logger.warn(
        {
          eventId,
          calendarId,
        },
        'Cancel event date request skipped: event not found'
      );

      return { success: false, error: 'Event not found' };
    }

    const targetCalendar = existingEvent.event_calendars.find(
      calendar => calendar.id === calendarId
    );

    if (!targetCalendar) {
      logger.warn(
        {
          eventId,
          calendarId,
        },
        'Cancel event date request skipped: schedule not found'
      );

      return { success: false, error: 'Event schedule not found' };
    }

    if (targetCalendar.date_status === DateStatus.CANCELLED) {
      logger.warn(
        {
          eventId,
          calendarId,
        },
        'Cancel event date request skipped: already canceled'
      );

      return {
        success: false,
        error: 'This event date has already been canceled.',
      };
    }

    if (!canCancelCalendar(targetCalendar)) {
      logger.warn(
        {
          eventId,
          calendarId,
        },
        'Cancel event date request blocked: minimum lead time not met'
      );

      return {
        success: false,
        error: `Event dates can only be canceled at least ${EVENT_CANCEL_MIN_LEAD_DAYS} days before the scheduled start time.`,
      };
    }

    await prisma.eventCalendar.update({
      where: { id: calendarId },
      data: {
        date_status: DateStatus.CANCELLED,
      },
    });

    logger.info(
      {
        eventId,
        calendarId,
      },
      'Event date canceled in database'
    );

    const remainingActiveCount = await prisma.eventCalendar.count({
      where: {
        event_id: eventId,
        date_status: DateStatus.VALID,
      },
    });

    if (remainingActiveCount === 0) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          eventStatus: EventStatus.INACTIVE,
        },
      });

      logger.info(
        {
          eventId,
          calendarId,
        },
        'Event marked inactive because no active dates remain'
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });

    if (!event) {
      return { success: false, error: 'Event not found after update' };
    }

    try {
      const notificationResult = await enqueueEventDateCanceledNotifications({
        eventId: existingEvent.id,
        eventTitle: event.eventTitle,
        eventLocation: event.eventLocation,
        canceledCalendars: [targetCalendar],
      });
      logger.info(
        {
          eventId,
          calendarId,
          notificationResult,
        },
        'Event date cancellation notifications queued'
      );
    } catch (notificationError) {
      console.error(
        'Failed to send event date cancellation notifications:',
        notificationError
      );
    }

    revalidatePath('/admin/events');
    revalidatePath(`/admin/events/${eventId}`);
    logger.info(
      {
        eventId,
        calendarId,
      },
      'Cancel event date request completed'
    );
    return { success: true, data: serializeEvent(event) };
  } catch (error) {
    console.error('Error canceling event date:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to cancel event date' };
  }
}

export async function getActiveEventsAction() {
  const events = await prisma.event.findMany({
    where: {
      eventStatus: EventStatus.ACTIVE,
    },
    include: {
      event_galleries: true,
      event_pricing: true,
      event_calendars: true,
    },
  });

  return toPlainObject(events);
}

export async function getEventByIdAction(eventId: number) {
  if (!eventId || Number.isNaN(eventId)) {
    throw new Error('Invalid event ID');
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      event_galleries: true,
      event_calendars: true,
      event_pricing: true,
    },
  });

  if (!event) {
    return null;
  }

  return toPlainObject({
    ...event,
    event_pricing: event.event_pricing || [],
    event_galleries: event.event_galleries || [],
    event_calendars: event.event_calendars || [],
  });
}

export async function getConfirmedBookingsAction() {
  const userId = await getCurrentDbUserId();
  if (!userId) throw new Error('Authentication required.');

  const bookings = await prisma.userEvent.findMany({
    where: {
      user_id: userId,
      status: 'CONFIRMED',
    },
    orderBy: { id: 'desc' },
    include: {
      event: {
        include: {
          event_galleries: true,
        },
      },
    },
  });

  return toPlainObject(bookings);
}

export async function getBookingsAction() {
  const userId = await getCurrentDbUserId();
  if (!userId) throw new Error('Authentication required.');

  const bookings = await prisma.userEvent.findMany({
    where: {
      user_id: userId,
    },
    orderBy: { id: 'desc' },
    include: {
      event: {
        include: {
          event_galleries: true,
        },
      },
    },
  });

  return toPlainObject(bookings);
}

export async function createOrUpdateBookingAction(input: BookingInput) {
  const userId = await getCurrentDbUserId();
  if (!userId) throw new Error('Authentication required.');

  const eventId = Number(input.eventId);
  const calendarId = Number(input.calendarId);
  const quantity = Number(input.quantity);
  const total = Number(input.total);
  const normalizedTickets = input.tickets
    .map(ticket => ({
      priceId: Number(ticket.priceId),
      qty: Number(ticket.qty),
    }))
    .filter(
      ticket =>
        Number.isInteger(ticket.priceId) &&
        ticket.priceId > 0 &&
        Number.isInteger(ticket.qty) &&
        ticket.qty > 0
    );

  if (!Number.isInteger(calendarId) || calendarId <= 0) {
    throw new Error('Invalid event calendar ID');
  }

  if (normalizedTickets.length === 0) {
    throw new Error('At least one ticket type is required.');
  }

  const eventCalendar = await prisma.eventCalendar.findFirst({
    where: {
      id: calendarId,
      event_id: eventId,
    },
    select: {
      event_date: true,
    },
  });

  if (!eventCalendar) {
    throw new Error('Selected event date was not found');
  }

  const eventPricingRows = await prisma.eventPricing.findMany({
    where: {
      event_id: eventId,
      id: {
        in: normalizedTickets.map(ticket => ticket.priceId),
      },
    },
    select: {
      id: true,
      price_level: true,
      event_price: true,
    },
  });

  const eventPricingById = new Map(
    eventPricingRows.map(row => [
      row.id,
      {
        priceLevel: String(row.price_level),
        unitPrice: Number(row.event_price.toString()),
      },
    ])
  );

  const ticketLines = normalizedTickets.map(ticket => {
    const pricing = eventPricingById.get(ticket.priceId);
    if (!pricing) {
      throw new Error(`Ticket price ${ticket.priceId} is not available.`);
    }

    return {
      priceId: ticket.priceId,
      qty: ticket.qty,
      priceLevel: pricing.priceLevel,
      lineTotal: pricing.unitPrice * ticket.qty,
    };
  });

  const expectedQuantity = ticketLines.reduce((sum, line) => sum + line.qty, 0);
  const expectedTotal = ticketLines.reduce(
    (sum, line) => sum + line.lineTotal,
    0
  );

  if (expectedQuantity !== quantity) {
    throw new Error('Ticket quantity mismatch. Please refresh and try again.');
  }

  if (expectedTotal !== total) {
    throw new Error('Ticket total mismatch. Please refresh and try again.');
  }

  const ticketType = ticketLines
    .map(line => `${line.priceLevel} x${line.qty}`)
    .join(', ');
  const eventDate = new Date(eventCalendar.event_date);

  const existing = await prisma.userEvent.findFirst({
    where: {
      user_id: userId,
      event_id: eventId,
      event_date: eventDate,
      status: 'CONFIRMED',
    },
  });

  if (existing) {
    const updated = await prisma.userEvent.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantity,
        total_amount: existing.total_amount + total,
        ticket_type: `${existing.ticket_type}, ${ticketType}`,
      },
    });

    revalidatePath('/dashboard/bookings');
    revalidatePath('/dashboard/events');

    return toPlainObject({
      message: 'Booking updated',
      booking: updated,
      alreadyExists: true,
    });
  }

  const booking = await prisma.userEvent.create({
    data: {
      user_id: userId,
      event_id: eventId,
      event_date: eventDate,
      ticket_type: ticketType,
      quantity,
      total_amount: total,
      status: 'CONFIRMED',
    },
  });

  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/events');

  return toPlainObject({
    message: 'Booking created',
    booking,
    alreadyExists: false,
  });
}

export async function cancelBookingAction(id: number, reason?: string) {
  const userId = await getCurrentDbUserId();
  if (!userId) throw new Error('Authentication required.');

  const bookingId = Number(id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    throw new Error('Invalid booking ID');
  }

  const existing = await prisma.userEvent.findFirst({
    where: {
      id: bookingId,
      user_id: userId,
    },
  });

  if (!existing) {
    throw new Error('Booking not found');
  }

  const updated = await prisma.userEvent.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancel_reason: reason?.trim() || 'No reason',
    },
  });

  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/events');

  return toPlainObject(updated);
}
