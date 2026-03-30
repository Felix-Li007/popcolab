import { Prisma } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import type { Event } from '@/types/event-type';

export type EventSearchFilters = {
  keyword?: string;
  status?: Event['eventStatus'] | 'all';
  priceMin?: string;
  priceMax?: string;
  dateTimeStart?: string;
  dateTimeEnd?: string;
};

type EventRecord = Prisma.EventGetPayload<{
  include: {
    event_galleries: true;
    event_calendars: true;
    event_pricing: true;
  };
}>;

type EventPricingRecord = NonNullable<EventRecord['event_pricing']>[number];

function parseNumber(value?: string): number | null {
  if (!value || value.trim() === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateTime(value?: string): Date | null {
  if (!value || value.trim() === '') return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function serializeEventPricing(
  pricing: EventPricingRecord
): NonNullable<Event['event_pricing']>[number] {
  return {
    ...pricing,
    event_price: pricing.event_price.toString(),
  };
}

export function serializeEvent(event: EventRecord): Event {
  return {
    ...event,
    event_pricing: event.event_pricing?.map(serializeEventPricing),
  };
}

async function getEventIdsByDateRange(
  dateTimeStart?: string,
  dateTimeEnd?: string
): Promise<number[] | null> {
  const startDateTime = parseDateTime(dateTimeStart);
  const endDateTime = parseDateTime(dateTimeEnd);

  if (startDateTime === null && endDateTime === null) {
    return null;
  }

  let calendarDateFilter = Prisma.sql``;

  if (startDateTime && endDateTime) {
    calendarDateFilter = Prisma.sql`
            WHERE ec.date_status = 'VALID'
              AND (ec.event_date::date + ec.end_time::time) >= ${startDateTime}
              AND (ec.event_date::date + ec.start_time::time) <= ${endDateTime}
        `;
  } else if (startDateTime) {
    calendarDateFilter = Prisma.sql`
            WHERE ec.date_status = 'VALID'
              AND (ec.event_date::date + ec.end_time::time) >= ${startDateTime}
        `;
  } else if (endDateTime) {
    calendarDateFilter = Prisma.sql`
            WHERE ec.date_status = 'VALID'
              AND (ec.event_date::date + ec.start_time::time) <= ${endDateTime}
        `;
  }

  const rows = await prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
        SELECT DISTINCT e.id
        FROM event e
        INNER JOIN event_calendar ec ON ec.event_id = e.id
        ${calendarDateFilter}
    `);

  return rows.map(row => row.id);
}

export async function getEvents(
  filters: EventSearchFilters = {}
): Promise<Event[]> {
  try {
    const where: Prisma.EventWhereInput = {};

    const keyword = filters.keyword?.trim();
    if (keyword) {
      where.OR = [
        {
          eventTitle: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          eventLocation: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (filters.status && filters.status !== 'all') {
      where.eventStatus = filters.status;
    }

    const minPrice = parseNumber(filters.priceMin);
    const maxPrice = parseNumber(filters.priceMax);
    if (minPrice !== null || maxPrice !== null) {
      const priceWhere: Prisma.EventPricingWhereInput = {};
      const eventPriceFilter: Prisma.DecimalFilter = {};

      if (minPrice !== null) {
        eventPriceFilter.gte = new Prisma.Decimal(minPrice);
      }

      if (maxPrice !== null) {
        eventPriceFilter.lte = new Prisma.Decimal(maxPrice);
      }

      priceWhere.event_price = eventPriceFilter;

      where.event_pricing = {
        some: priceWhere,
      };
    }

    const matchingEventIds = await getEventIdsByDateRange(
      filters.dateTimeStart,
      filters.dateTimeEnd
    );
    if (matchingEventIds !== null) {
      where.id = {
        in: matchingEventIds,
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return events.map(serializeEvent);
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

export async function getEventById(id: number): Promise<Event | null> {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });

    if (!event) {
      console.warn(`Event not found: id=${id}`);
      return null;
    }

    return serializeEvent(event);
  } catch (error) {
    console.error(`Error fetching event (id=${id}):`, error);
    throw error;
  }
}

export async function getEventCount(): Promise<number> {
  try {
    return await prisma.event.count();
  } catch (error) {
    console.error('Error counting events:', error);
    throw error;
  }
}

export async function getEventsByStatus(
  status: Event['eventStatus']
): Promise<Event[]> {
  try {
    const events = await prisma.event.findMany({
      where: { eventStatus: status },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return events.map(serializeEvent);
  } catch (error) {
    console.error('Error fetching events by status:', error);
    throw error;
  }
}
