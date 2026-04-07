import { OrderStatus, PrismaClient, type Prisma } from '@/libs/prisma/client';
import {
  formatDateForPrismaDateField,
  formatTimeForPrismaTimeField,
  formatScheduleTimeValue,
  parseCalendarDateValue,
} from '@/utils/event-schedule';

const TEST_USER_EMAIL = 'event-cancel-tester@popcolab.test';
const TARGET_EVENT_TITLE = 'Team Building Sprint';

type SeedUserRecord = {
  id: number;
  email: string;
  userName: string;
};

type SeedCalendar = {
  id: number;
  event_date: Date;
  start_time: Date;
  end_time: Date;
};

type SeedEvent = {
  id: number;
  eventTitle: string;
  event_calendars: SeedCalendar[];
  event_pricing: Array<{ event_price: Prisma.Decimal }>;
};

function buildScheduleDate(calendar: SeedCalendar) {
  const eventDate = parseCalendarDateValue(calendar.event_date);
  const startTime = formatScheduleTimeValue(calendar.start_time);
  const endTime = formatScheduleTimeValue(calendar.end_time);

  if (!eventDate || !startTime || !endTime) {
    throw new Error(
      `Invalid calendar schedule for event date seed (calendarId=${calendar.id}).`
    );
  }

  const schedule_date = formatDateForPrismaDateField(eventDate);
  const start_time = formatTimeForPrismaTimeField(startTime);
  const end_time = formatTimeForPrismaTimeField(endTime);

  if (!start_time || !end_time) {
    throw new Error(
      `Invalid calendar schedule for event date seed (calendarId=${calendar.id}).`
    );
  }

  return {
    schedule_date,
    start_time,
    end_time,
  };
}

async function resolveTargetEvent(prisma: PrismaClient): Promise<SeedEvent> {
  const event = await prisma.event.findFirst({
    where: {
      eventTitle: TARGET_EVENT_TITLE,
    },
    select: {
      id: true,
      eventTitle: true,
      event_calendars: {
        select: {
          id: true,
          event_date: true,
          start_time: true,
          end_time: true,
        },
        orderBy: {
          id: 'asc',
        },
      },
      event_pricing: {
        select: {
          event_price: true,
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
  });

  if (!event) {
    throw new Error(`Unable to find seeded event: ${TARGET_EVENT_TITLE}`);
  }

  return event;
}

async function clearExistingSeedOrders(
  prisma: PrismaClient,
  userId: number
): Promise<void> {
  const existingOrders = await prisma.order.findMany({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      payment_id: true,
    },
  });

  if (existingOrders.length === 0) {
    return;
  }

  const orderIds = existingOrders.map(order => order.id);
  const paymentIds = existingOrders
    .map(order => order.payment_id)
    .filter((paymentId): paymentId is number => paymentId !== null);

  await prisma.orderItem.deleteMany({
    where: {
      order_id: {
        in: orderIds,
      },
    },
  });

  await prisma.order.deleteMany({
    where: {
      id: {
        in: orderIds,
      },
    },
  });

  if (paymentIds.length > 0) {
    await prisma.payment.deleteMany({
      where: {
        id: {
          in: paymentIds,
        },
      },
    });
  }
}

async function ensureTestUser(prisma: PrismaClient): Promise<SeedUserRecord> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerk_id: 'seed-event-cancel-tester' },
        { email: TEST_USER_EMAIL },
      ],
    },
    select: {
      id: true,
    },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerk_id: 'seed-event-cancel-tester',
          email: TEST_USER_EMAIL,
          user_name: 'Event Cancel Tester',
        },
        select: {
          id: true,
          email: true,
          user_name: true,
        },
      })
    : await prisma.user.create({
        data: {
          clerk_id: 'seed-event-cancel-tester',
          email: TEST_USER_EMAIL,
          user_name: 'Event Cancel Tester',
        },
        select: {
          id: true,
          email: true,
          user_name: true,
        },
      });

  return {
    id: user.id,
    email: user.email,
    userName: user.user_name ?? 'Event Cancel Tester',
  };
}

export async function seedEventCancellationOrders(
  prisma: PrismaClient
): Promise<void> {
  const user = await ensureTestUser(prisma);
  const event = await resolveTargetEvent(prisma);

  await clearExistingSeedOrders(prisma, user.id);

  const itemPrice = event.event_pricing[0]?.event_price?.toString();
  if (!itemPrice) {
    throw new Error(
      `Unable to find pricing for event cancellation seed: ${TARGET_EVENT_TITLE}`
    );
  }

  for (const calendar of event.event_calendars) {
    const scheduleSlot = buildScheduleDate(calendar);
    const payment = await prisma.payment.create({
      data: {
        order_amount: itemPrice,
        gst_rate: null,
        pst_rate: null,
        hst_rate: null,
        grand_total: itemPrice,
        gst_amount: null,
        hst_amount: null,
        payment_method: 'stripe',
        customer_id: `seed-customer-${calendar.id}`,
        customer_email: user.email,
        payment_status: 'paid',
      },
      select: {
        id: true,
      },
    });

    const order = await prisma.order.create({
      data: {
        user_id: user.id,
        order_status: OrderStatus.PAID,
        payment_id: payment.id,
      },
      select: {
        id: true,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        item_type: 'EVENT',
        event_id: event.id,
        item_price: itemPrice,
        schedule_date: scheduleSlot.schedule_date,
        start_time: scheduleSlot.start_time,
        end_time: scheduleSlot.end_time,
      },
    });

    console.log(
      `Created event cancellation order for ${event.eventTitle} / calendar #${calendar.id}`
    );
  }
}
