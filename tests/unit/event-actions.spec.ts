jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/services/clerk-service', () => ({
  requireAdminActionAccess: jest.fn(),
  getCurrentDbUserId: jest.fn(),
}));

jest.mock('@/services/notification-service', () => ({
  enqueueDateCanceledNotifications: jest.fn(),
  enqueueEventCreatedNotifications: jest.fn(),
}));

jest.mock('@/services/event-service', () => ({
  serializeEvent: jest.fn(value => value),
}));

jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventCalendar: {
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { DateStatus, EventStatus } from '@/libs/prisma/enums';
import { prisma } from '@/libs/prisma-client';
import {
  cancelEventAction,
  cancelEventCalendarAction,
  updateEventAction,
} from '@/actions/event-actions';
import { enqueueDateCanceledNotifications } from '@/services/notification-service';
import { requireAdminActionAccess } from '@/services/clerk-service';

type MockedPrisma = {
  event: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  eventCalendar: {
    update: jest.Mock;
    count: jest.Mock;
  };
};

const prismaMock = prisma as unknown as MockedPrisma;
const requireAdminActionAccessMock =
  requireAdminActionAccess as jest.MockedFunction<
    typeof requireAdminActionAccess
  >;
const enqueueDateCanceledNotificationsMock =
  enqueueDateCanceledNotifications as jest.MockedFunction<
    typeof enqueueDateCanceledNotifications
  >;

describe('event-actions cancellation flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-30T12:00:00.000Z'));

    requireAdminActionAccessMock.mockResolvedValue(undefined);
    enqueueDateCanceledNotificationsMock.mockResolvedValue({
      recipientCount: 1,
      queuedCount: 1,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('cancelEventAction marks the event inactive, cancels active dates, and starts the notification chain', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventStatus: EventStatus.ACTIVE,
      event_calendars: [
        {
          id: 101,
          event_date: new Date('2026-04-05T00:00:00.000Z'),
          start_time: new Date('1970-01-01T18:00:00.000Z'),
          end_time: new Date('1970-01-01T20:00:00.000Z'),
          date_status: DateStatus.VALID,
        },
        {
          id: 102,
          event_date: new Date('2026-04-06T00:00:00.000Z'),
          start_time: new Date('1970-01-01T18:00:00.000Z'),
          end_time: new Date('1970-01-01T20:00:00.000Z'),
          date_status: DateStatus.CANCELLED,
        },
      ],
    });
    prismaMock.event.update.mockResolvedValue({
      id: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventStatus: EventStatus.INACTIVE,
      event_galleries: [],
      event_calendars: [],
      event_pricing: [],
    });

    const result = await cancelEventAction(15);

    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: { id: 15 },
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
    expect(enqueueDateCanceledNotificationsMock).toHaveBeenCalledWith({
      eventId: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      canceledCalendars: [
        {
          id: 101,
          event_date: new Date('2026-04-05T00:00:00.000Z'),
          start_time: new Date('1970-01-01T18:00:00.000Z'),
          end_time: new Date('1970-01-01T20:00:00.000Z'),
          date_status: DateStatus.VALID,
        },
      ],
    });
    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: 15,
        eventStatus: EventStatus.INACTIVE,
      }),
    });
  });

  test('cancelEventCalendarAction cancels only the selected date and queues the matching date-canceled notification', async () => {
    const targetCalendar = {
      id: 101,
      event_date: new Date('2026-04-05T00:00:00.000Z'),
      start_time: new Date('1970-01-01T18:00:00.000Z'),
      end_time: new Date('1970-01-01T20:00:00.000Z'),
      date_status: DateStatus.VALID,
    };

    prismaMock.event.findUnique
      .mockResolvedValueOnce({
        id: 15,
        eventTitle: 'Spring Gala',
        eventLocation: 'Main Hall',
        event_calendars: [targetCalendar],
      })
      .mockResolvedValueOnce({
        id: 15,
        eventTitle: 'Spring Gala',
        eventLocation: 'Main Hall',
        eventStatus: EventStatus.INACTIVE,
        event_galleries: [],
        event_calendars: [
          {
            ...targetCalendar,
            date_status: DateStatus.CANCELLED,
          },
        ],
        event_pricing: [],
      });
    prismaMock.eventCalendar.update.mockResolvedValue({
      id: 101,
      date_status: DateStatus.CANCELLED,
    });
    prismaMock.eventCalendar.count.mockResolvedValue(0);
    prismaMock.event.update.mockResolvedValue({
      id: 15,
      eventStatus: EventStatus.INACTIVE,
    });

    const result = await cancelEventCalendarAction(15, 101);

    expect(prismaMock.eventCalendar.update).toHaveBeenCalledWith({
      where: { id: 101 },
      data: {
        date_status: DateStatus.CANCELLED,
      },
    });
    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: { id: 15 },
      data: {
        eventStatus: EventStatus.INACTIVE,
      },
    });
    expect(enqueueDateCanceledNotificationsMock).toHaveBeenCalledWith({
      eventId: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      canceledCalendars: [targetCalendar],
    });
    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: 15,
        eventStatus: EventStatus.INACTIVE,
      }),
    });
  });

  test('updateEventAction keeps existing dates and creates newly added dates without treating them as canceled', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventStatus: EventStatus.ACTIVE,
      event_calendars: [
        {
          id: 101,
          event_date: new Date('2026-04-05T00:00:00.000Z'),
          start_time: new Date('1970-01-01T18:00:00.000Z'),
          end_time: new Date('1970-01-01T20:00:00.000Z'),
          date_status: DateStatus.VALID,
        },
      ],
    });
    prismaMock.event.update.mockResolvedValue({
      id: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventStatus: EventStatus.ACTIVE,
      event_galleries: [],
      event_calendars: [],
      event_pricing: [],
    });

    const result = await updateEventAction(15, {
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventStatus: EventStatus.ACTIVE,
      capacity_max: 50,
      eventCalendars: [
        {
          eventDate: '2026-04-05',
          startTime: '18:00',
          endTime: '20:00',
        },
        {
          eventDate: '2026-04-06',
          startTime: '18:00',
          endTime: '20:00',
        },
      ],
    });

    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: { id: 15 },
      data: {
        eventTitle: 'Spring Gala',
        eventLocation: 'Main Hall',
        eventStatus: EventStatus.ACTIVE,
        capacity_max: 50,
        event_calendars: {
          create: [
            {
              event_date: new Date('2026-04-06T00:00:00.000Z'),
              start_time: new Date('1970-01-01T18:00:00.000Z'),
              end_time: new Date('1970-01-01T20:00:00.000Z'),
              date_status: DateStatus.VALID,
            },
          ],
        },
      },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });
    expect(enqueueDateCanceledNotificationsMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: 15,
        eventStatus: EventStatus.ACTIVE,
      }),
    });
  });

  test('updateEventAction cancels removed dates, marks the event inactive when none remain, and queues date-canceled notifications', async () => {
    const removedCalendar = {
      id: 101,
      event_date: new Date('2026-04-06T00:00:00.000Z'),
      start_time: new Date('1970-01-01T18:00:00.000Z'),
      end_time: new Date('1970-01-01T20:00:00.000Z'),
      date_status: DateStatus.VALID,
    };

    prismaMock.event.findUnique.mockResolvedValue({
      id: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventStatus: EventStatus.ACTIVE,
      event_calendars: [removedCalendar],
    });
    prismaMock.event.update.mockResolvedValue({
      id: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventStatus: EventStatus.INACTIVE,
      event_galleries: [],
      event_calendars: [
        {
          ...removedCalendar,
          date_status: DateStatus.CANCELLED,
        },
      ],
      event_pricing: [],
    });

    const result = await updateEventAction(15, {
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      eventCalendars: [],
    });

    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: { id: 15 },
      data: {
        eventTitle: 'Spring Gala',
        eventLocation: 'Main Hall',
        eventStatus: EventStatus.INACTIVE,
        event_calendars: {
          updateMany: [
            {
              where: { id: 101 },
              data: {
                date_status: DateStatus.CANCELLED,
              },
            },
          ],
        },
      },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });
    expect(enqueueDateCanceledNotificationsMock).toHaveBeenCalledWith({
      eventId: 15,
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      canceledCalendars: [removedCalendar],
    });
    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: 15,
        eventStatus: EventStatus.INACTIVE,
      }),
    });
  });
});
