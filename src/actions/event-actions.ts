'use server';

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
import { serializeEvent } from '@/services/event-service';
import { sanitizeRichTextHtml } from '@/utils/html-sanitizer';
import {
  parseDateInputValue,
  formatDateForPrismaDateField,
  formatTimeForPrismaTimeField,
} from '@/utils/event-schedule';

const uploadDirectorySetting =
  process.env.EVENT_GALLERY_UPLOAD_DIR ?? 'public/images/events';
const publicPathSetting =
  process.env.EVENT_GALLERY_PUBLIC_PATH ?? '/images/events';

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), uploadDirectorySetting);
const PUBLIC_PATH_PREFIX = publicPathSetting.startsWith('/')
  ? publicPathSetting.replace(/\/+$/, '')
  : `/${publicPathSetting.replace(/\/+$/, '')}`;

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
              };
            }),
          }
        : undefined;

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
