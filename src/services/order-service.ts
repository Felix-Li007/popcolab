import 'server-only';

import type Stripe from 'stripe';
import {
  CalendarStatus,
  OrderStatus,
  Prisma,
  ProcessStatus,
} from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import {
  getStripeServerClient,
  toStripeAmountCents,
} from '@/libs/stripe-server';
import {
  buildExperiencePurchaseQuote,
  getPurchasableExperienceById,
} from '@/services/experience-service';
import { upsertClerkUser } from '@/services/user-service';
import { QSTASH_TASK_TYPE } from '@/types/qstash-task';
import { logger } from '@/utils/logging-util';
import {
  formatDateForPrismaDateField,
  formatLocalTimeValue,
  formatTimeForPrismaTimeField,
  mergeDateAndTime,
  parseCalendarDateValue,
} from '@/utils/event-schedule';

const ORDER_EXPIRY_HOURS = 24;
const PAYMENT_METHOD_PLACEHOLDER = 'stripe';
const EXPERIENCE_CALENDAR_STATUS = {
  LOCKED: CalendarStatus.LOCKED,
  BLOCKED: CalendarStatus.BLOCKED,
} as const;

export type ExperienceCheckoutQuote = {
  currency: 'CAD';
  requestedHours: number;
  includedHours: number | null;
  extraHours: number;
  baseAmountCad: number;
  extraAmountCad: number;
  totalAmountCad: number;
};

export type CreatedExperienceCheckout = {
  orderId: number;
  paymentId: number;
  paymentIntentId: string;
  clientSecret: string;
  expiresAt: string;
  quote: ExperienceCheckoutQuote;
};

export type CreatedEventCheckout = {
  orderId: number;
  paymentId: number;
  paymentIntentId: string;
  clientSecret: string;
  amountCad: number;
};

export type ExperienceOrderResult = {
  orderId: number;
  paymentId: number | null;
  orderStatus: OrderStatus;
  paymentStatus: string | null;
  paymentMethod: string | null;
  customerEmail: string | null;
  experienceId: number | null;
  experienceTitle: string | null;
  providerLabel: string | null;
  scheduleDate: Date | null;
  scheduleStartTime: Date | null;
  scheduleEndTime: Date | null;
  itemPriceCad: number | null;
  totalAmountCad: number | null;
  requestedHours: number | null;
  includedHours: number | null;
  extraHours: number | null;
  expiredAt: Date | null;
  updatedAt: Date | null;
};

type CreateExperienceCheckoutInput = {
  clerkUserId: string;
  customerEmail: string;
  customerName?: string | null;
  experienceId: number;
  requestedHours?: number | null;
  scheduleDate: string;
  proposalId?: number | null;
};

type CreateEventCheckoutInput = {
  clerkUserId: string;
  customerEmail: string;
  customerName?: string | null;
  eventId: number;
  calendarId: number;
  quantity: number;
  total: number;
  tickets: Array<{
    priceId: number;
    qty: number;
  }>;
};

type PrismaUniqueConstraintError = {
  code: string;
  meta?: {
    target?: unknown;
  };
};

type OrderCalendarItem = {
  experience_id: number;
  schedule_date: Date;
  start_time: Date;
  end_time: Date;
};

type ExperienceCalendarSyncAction = 'block' | 'release_locked' | 'noop';

function normalizeCustomerEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error('A customer email address is required.');
  }

  return trimmed.slice(0, 50);
}

function normalizeCustomerName(name?: string | null): string | undefined {
  const trimmed = name?.trim();
  return trimmed ? trimmed.slice(0, 255) : undefined;
}

function parseScheduleDate(value: string): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError('Please select a valid schedule date.');
  }

  if (parsed.getTime() <= Date.now()) {
    throw new Error('Schedule date must be in the future.');
  }

  return parsed;
}

function isExperienceCalendarSlotUniqueViolation(
  error: unknown
): error is PrismaUniqueConstraintError {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as PrismaUniqueConstraintError;
  if (candidate.code !== 'P2002') return false;

  const target = candidate.meta?.target;
  if (!target) return true;

  if (Array.isArray(target)) {
    return target.includes('experience_id') && target.includes('schedule_date');
  }

  if (typeof target === 'string') {
    return (
      target.includes('experience_calendar_experience_id_schedule_date_key') ||
      (target.includes('experience_id') && target.includes('schedule_date'))
    );
  }

  return false;
}

async function buildExperienceScheduleConflictError(
  tx: Prisma.TransactionClient,
  experienceId: number,
  scheduleDate: Date
): Promise<Error> {
  const existing = await tx.experienceCalendar.findFirst({
    where: {
      experience_id: experienceId,
      schedule_date: scheduleDate,
    },
    select: {
      calendar_status: true,
    },
  });

  if (existing?.calendar_status === EXPERIENCE_CALENDAR_STATUS.BLOCKED) {
    return new Error('This schedule date has already been booked.');
  }

  return new Error(
    'This schedule date is temporarily locked by another order.'
  );
}

async function assertExperienceScheduleAvailable(
  tx: Prisma.TransactionClient,
  experienceId: number,
  scheduleDate: Date
): Promise<void> {
  const existing = await tx.experienceCalendar.findFirst({
    where: {
      experience_id: experienceId,
      schedule_date: scheduleDate,
      calendar_status: {
        in: [
          EXPERIENCE_CALENDAR_STATUS.LOCKED,
          EXPERIENCE_CALENDAR_STATUS.BLOCKED,
        ],
      },
    },
    select: {
      calendar_status: true,
    },
  });

  if (!existing) return;

  if (existing.calendar_status === EXPERIENCE_CALENDAR_STATUS.BLOCKED) {
    throw new Error('This schedule date has already been booked.');
  }

  throw new Error('This schedule date is temporarily locked by another order.');
}

async function lockExperienceScheduleDate(
  tx: Prisma.TransactionClient,
  experienceId: number,
  scheduleDate: Date
): Promise<void> {
  try {
    await tx.experienceCalendar.create({
      data: {
        experience_id: experienceId,
        schedule_date: scheduleDate,
        calendar_status: EXPERIENCE_CALENDAR_STATUS.LOCKED,
      },
    });
  } catch (error) {
    if (isExperienceCalendarSlotUniqueViolation(error)) {
      throw await buildExperienceScheduleConflictError(
        tx,
        experienceId,
        scheduleDate
      );
    }

    throw error;
  }
}

function getExperienceCalendarSyncAction(
  orderStatus: OrderStatus
): ExperienceCalendarSyncAction {
  if (orderStatus === OrderStatus.PAID) {
    return 'block';
  }

  if (
    orderStatus === OrderStatus.PAYMENT_FAILED ||
    orderStatus === OrderStatus.CANCELED
  ) {
    return 'release_locked';
  }

  return 'noop';
}

function getOrderItemStartDateTime(item: OrderCalendarItem) {
  const parsedDate = parseCalendarDateValue(item.schedule_date);
  const startTime = formatLocalTimeValue(item.start_time);

  if (!parsedDate || !startTime) {
    return null;
  }

  return mergeDateAndTime(parsedDate, startTime);
}

async function blockExperienceCalendarSlot(
  tx: Prisma.TransactionClient,
  item: OrderCalendarItem
): Promise<void> {
  const scheduleDateTime = getOrderItemStartDateTime(item);

  if (!scheduleDateTime) {
    throw new Error('Unable to resolve experience schedule start time.');
  }

  const updated = await tx.experienceCalendar.updateMany({
    where: {
      experience_id: item.experience_id,
      schedule_date: scheduleDateTime,
      calendar_status: {
        in: [
          EXPERIENCE_CALENDAR_STATUS.LOCKED,
          EXPERIENCE_CALENDAR_STATUS.BLOCKED,
        ],
      },
    },
    data: {
      calendar_status: EXPERIENCE_CALENDAR_STATUS.BLOCKED,
    },
  });

  if (updated.count > 0) {
    return;
  }

  try {
    await tx.experienceCalendar.create({
      data: {
        experience_id: item.experience_id,
        schedule_date: scheduleDateTime,
        calendar_status: EXPERIENCE_CALENDAR_STATUS.BLOCKED,
      },
    });
  } catch (error) {
    if (!isExperienceCalendarSlotUniqueViolation(error)) {
      throw error;
    }

    await tx.experienceCalendar.updateMany({
      where: {
        experience_id: item.experience_id,
        schedule_date: scheduleDateTime,
      },
      data: {
        calendar_status: EXPERIENCE_CALENDAR_STATUS.BLOCKED,
      },
    });
  }
}

async function releaseLockedExperienceCalendarSlot(
  tx: Prisma.TransactionClient,
  item: OrderCalendarItem
): Promise<void> {
  const scheduleDateTime = getOrderItemStartDateTime(item);

  if (!scheduleDateTime) {
    throw new Error('Unable to resolve experience schedule start time.');
  }

  await tx.experienceCalendar.deleteMany({
    where: {
      experience_id: item.experience_id,
      schedule_date: scheduleDateTime,
      calendar_status: EXPERIENCE_CALENDAR_STATUS.LOCKED,
    },
  });
}

async function syncExperienceCalendarForOrderStatus(
  tx: Prisma.TransactionClient,
  orderItems: OrderCalendarItem[],
  orderStatus: OrderStatus
): Promise<void> {
  const action = getExperienceCalendarSyncAction(orderStatus);

  if (action === 'noop') {
    return;
  }

  for (const item of orderItems) {
    if (action === 'block') {
      await blockExperienceCalendarSlot(tx, item);
    } else {
      await releaseLockedExperienceCalendarSlot(tx, item);
    }
  }
}

async function syncUserExperiencesForPaidOrder(
  tx: Prisma.TransactionClient,
  order: {
    id: number;
    user_id: number;
    proposal_id: number | null;
    order_items: OrderCalendarItem[];
  }
): Promise<void> {
  for (const item of order.order_items) {
    const scheduleDateTime = getOrderItemStartDateTime(item);

    if (!scheduleDateTime) {
      throw new Error('Unable to resolve experience schedule start time.');
    }

    await tx.userExperience.upsert({
      where: {
        order_id_experience_id_schedule_date: {
          order_id: order.id,
          experience_id: item.experience_id,
          schedule_date: scheduleDateTime,
        },
      },
      create: {
        order_id: order.id,
        user_id: order.user_id,
        proposal_id: order.proposal_id,
        experience_id: item.experience_id,
        schedule_date: scheduleDateTime,
        complete_date: null,
        process_status: ProcessStatus.PROGRESS,
      },
      update: {},
    });
  }
}

function getRequestedHoursFromQuote(quote: ExperienceCheckoutQuote): number {
  return quote.requestedHours;
}

function isQStashConfigured(): boolean {
  return Boolean(
    process.env.QSTASH_TOKEN &&
    process.env.QSTASH_ENDPOINT_PATH &&
    (process.env.QSTASH_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL)
  );
}

function toSerializableQuote(
  quote: ReturnType<typeof buildExperiencePurchaseQuote>
): ExperienceCheckoutQuote {
  return {
    currency: quote.currency,
    requestedHours: quote.requestedHours,
    includedHours: quote.includedHours,
    extraHours: quote.extraHours,
    baseAmountCad: quote.baseAmountCad,
    extraAmountCad: quote.extraAmountCad,
    totalAmountCad: quote.totalAmountCad,
  };
}

function mapStripeStatuses(
  status: Stripe.PaymentIntent.Status
): Pick<ExperienceOrderResult, 'orderStatus' | 'paymentStatus'> {
  if (status === 'succeeded') {
    return {
      orderStatus: OrderStatus.PAID,
      paymentStatus: 'succeeded',
    };
  }

  if (status === 'processing') {
    return {
      orderStatus: OrderStatus.PROCESSING,
      paymentStatus: 'processing',
    };
  }

  if (status === 'requires_action') {
    return {
      orderStatus: OrderStatus.PENDING_PAYMENT,
      paymentStatus: 'requires_action',
    };
  }

  if (status === 'requires_payment_method') {
    return {
      orderStatus: OrderStatus.PAYMENT_FAILED,
      paymentStatus: 'requires_payment',
    };
  }

  if (status === 'canceled') {
    return {
      orderStatus: OrderStatus.CANCELED,
      paymentStatus: 'canceled',
    };
  }

  return {
    orderStatus: OrderStatus.PENDING_PAYMENT,
    paymentStatus: 'pending',
  };
}

function getPaymentMethodLabel(paymentIntent: Stripe.PaymentIntent): string {
  const candidate =
    paymentIntent.payment_method_types[0] ?? PAYMENT_METHOD_PLACEHOLDER;
  return candidate.slice(0, 20);
}

function amountCentsToCad(amount: number | null | undefined): number | null {
  if (!Number.isFinite(amount)) return null;
  return Math.round((amount ?? 0) / 100);
}

function isExperienceOrderItem(
  item: { experience_id: number | null } | null | undefined
): item is OrderCalendarItem {
  return Boolean(item && Number.isInteger(item.experience_id));
}

function getExperienceOrderItems(
  items: Array<{
    experience_id: number | null;
    schedule_date: Date;
    start_time: Date;
    end_time: Date;
  }>
): OrderCalendarItem[] {
  return items.filter(isExperienceOrderItem).map(item => ({
    experience_id: item.experience_id,
    schedule_date: item.schedule_date,
    start_time: item.start_time,
    end_time: item.end_time,
  }));
}

function buildOrderResult(order: {
  id: number;
  order_status: OrderStatus;
  expired_at: Date | null;
  updated_at: Date;
  payment: {
    id: number;
    payment_status: string;
    payment_method: string;
    customer_id: string;
    customer_email: string;
    grand_total: { toString(): string } | null;
  } | null;
  order_items: Array<{
    schedule_date: Date;
    start_time: Date;
    end_time: Date;
    item_price: { toString(): string };
    experience: {
      id: number;
      experience_title: string;
      provider: {
        provider_label: string;
      };
      experience_pricing: {
        starting_hour: number | null;
      } | null;
    } | null;
  }>;
}): ExperienceOrderResult {
  const firstItem = order.order_items[0] ?? null;
  const includedHours =
    firstItem?.experience?.experience_pricing?.starting_hour ?? null;
  const itemPriceCad = firstItem
    ? Number(firstItem.item_price.toString())
    : null;
  const totalAmountCad = order.payment?.grand_total
    ? Number(order.payment.grand_total.toString())
    : itemPriceCad;

  return {
    orderId: order.id,
    paymentId: order.payment?.id ?? null,
    orderStatus: order.order_status,
    paymentStatus: order.payment?.payment_status ?? null,
    paymentMethod: order.payment?.payment_method ?? null,
    customerEmail: order.payment?.customer_email ?? null,
    experienceId: firstItem?.experience?.id ?? null,
    experienceTitle: firstItem?.experience?.experience_title ?? null,
    providerLabel: firstItem?.experience?.provider.provider_label ?? null,
    scheduleDate: firstItem?.schedule_date ?? null,
    scheduleStartTime: firstItem?.start_time ?? null,
    scheduleEndTime: firstItem?.end_time ?? null,
    itemPriceCad,
    totalAmountCad,
    requestedHours: null,
    includedHours,
    extraHours: null,
    expiredAt: order.expired_at,
    updatedAt: order.updated_at,
  };
}

async function getOrderForSync(orderId: number) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      user_id: true,
      proposal_id: true,
      order_status: true,
      expired_at: true,
      payment: {
        select: {
          id: true,
          payment_status: true,
          payment_method: true,
          customer_id: true,
          customer_email: true,
          grand_total: true,
        },
      },
      order_items: {
        orderBy: { id: 'asc' },
        select: {
          experience_id: true,
          schedule_date: true,
          start_time: true,
          end_time: true,
          item_price: true,
          experience: {
            select: {
              id: true,
              experience_title: true,
              provider: {
                select: {
                  provider_label: true,
                },
              },
              experience_pricing: {
                select: {
                  starting_hour: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

async function getOwnedOrder(orderId: number, clerkUserId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      user: { clerk_id: clerkUserId },
    },
    select: {
      id: true,
      order_status: true,
      expired_at: true,
      updated_at: true,
      payment: {
        select: {
          id: true,
          payment_status: true,
          payment_method: true,
          customer_id: true,
          customer_email: true,
          grand_total: true,
        },
      },
      order_items: {
        orderBy: { id: 'asc' },
        select: {
          schedule_date: true,
          start_time: true,
          end_time: true,
          item_price: true,
          experience: {
            select: {
              id: true,
              experience_title: true,
              provider: {
                select: {
                  provider_label: true,
                },
              },
              experience_pricing: {
                select: {
                  starting_hour: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

async function applyStripePaymentIntentSync(
  orderId: number,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const existingOrder = await getOrderForSync(orderId);
  if (!existingOrder) return;

  const metadataPaymentId = Number.parseInt(
    paymentIntent.metadata.paymentId ?? '',
    10
  );
  if (
    existingOrder.payment &&
    Number.isInteger(metadataPaymentId) &&
    metadataPaymentId > 0 &&
    existingOrder.payment.id !== metadataPaymentId
  ) {
    throw new Error(
      'Payment intent metadata does not match the saved payment record.'
    );
  }

  const mapped = mapStripeStatuses(paymentIntent.status);
  const paymentMethod = getPaymentMethodLabel(paymentIntent);
  const customerId =
    typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : (paymentIntent.customer?.id ??
        existingOrder.payment?.customer_id ??
        '');
  const customerEmail =
    paymentIntent.receipt_email?.trim().slice(0, 50) ??
    existingOrder.payment?.customer_email ??
    '';
  const totalAmountCad =
    amountCentsToCad(paymentIntent.amount_received || paymentIntent.amount) ??
    (existingOrder.payment?.grand_total
      ? Number(existingOrder.payment.grand_total.toString())
      : null);

  if (existingOrder.payment) {
    await prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: existingOrder.payment!.id },
        data: {
          order_amount: totalAmountCad ?? existingOrder.payment!.grand_total,
          grand_total: totalAmountCad ?? existingOrder.payment!.grand_total,
          payment_method: paymentMethod,
          customer_id: customerId.slice(0, 255),
          customer_email: customerEmail,
          payment_status:
            mapped.paymentStatus ?? existingOrder.payment!.payment_status,
        },
      });

      await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          order_status: mapped.orderStatus,
          expired_at:
            mapped.orderStatus === OrderStatus.PAID
              ? null
              : existingOrder.expired_at,
        },
      });

      if (mapped.orderStatus === OrderStatus.PAID) {
        const experienceItems = getExperienceOrderItems(
          existingOrder.order_items.map(item => ({
            experience_id: item.experience_id,
            schedule_date: item.schedule_date,
            start_time: item.start_time,
            end_time: item.end_time,
          }))
        );

        await syncUserExperiencesForPaidOrder(tx, {
          id: existingOrder.id,
          user_id: existingOrder.user_id,
          proposal_id: existingOrder.proposal_id,
          order_items: experienceItems,
        });
      }

      await syncExperienceCalendarForOrderStatus(
        tx,
        getExperienceOrderItems(
          existingOrder.order_items.map(item => ({
            experience_id: item.experience_id,
            schedule_date: item.schedule_date,
            start_time: item.start_time,
            end_time: item.end_time,
          }))
        ),
        mapped.orderStatus
      );
    });

    return;
  }

  await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: existingOrder.id },
      data: {
        order_status: mapped.orderStatus,
        expired_at:
          mapped.orderStatus === OrderStatus.PAID
            ? null
            : existingOrder.expired_at,
      },
    });

    if (mapped.orderStatus === OrderStatus.PAID) {
      const experienceItems = getExperienceOrderItems(
        existingOrder.order_items.map(item => ({
          experience_id: item.experience_id,
          schedule_date: item.schedule_date,
          start_time: item.start_time,
          end_time: item.end_time,
        }))
      );

      await syncUserExperiencesForPaidOrder(tx, {
        id: existingOrder.id,
        user_id: existingOrder.user_id,
        proposal_id: existingOrder.proposal_id,
        order_items: experienceItems,
      });
    }

    await syncExperienceCalendarForOrderStatus(
      tx,
      getExperienceOrderItems(
        existingOrder.order_items.map(item => ({
          experience_id: item.experience_id,
          schedule_date: item.schedule_date,
          start_time: item.start_time,
          end_time: item.end_time,
        }))
      ),
      mapped.orderStatus
    );
  });
}

export async function scheduleExperienceOrderExpiry(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      expired_at: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  if (!order.expired_at) {
    return { scheduled: false, reason: 'missing_expired_at' } as const;
  }

  if (!isQStashConfigured()) {
    return { scheduled: false, reason: 'qstash_not_configured' } as const;
  }

  await getQStashClient().publishJSON({
    url: getQStashEndpointUrl(),
    body: {
      type: QSTASH_TASK_TYPE.EXPERIENCE_ORDER_EXPIRE,
      orderId,
    },
    notBefore: Math.floor(order.expired_at.getTime() / 1000),
    deduplicationId: `experience-order-expiry:${orderId}:${order.expired_at.toISOString()}`,
    retries: 3,
  });

  return { scheduled: true } as const;
}

export async function expireExperienceOrderIfDue(orderId: number) {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return { expired: false, reason: 'invalid_order_id' } as const;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: {
        select: {
          id: true,
          payment_status: true,
        },
      },
      order_items: {
        select: {
          experience_id: true,
          schedule_date: true,
          start_time: true,
          end_time: true,
        },
      },
    },
  });

  if (!order) {
    return { expired: false, reason: 'not_found' } as const;
  }

  if (!order.expired_at) {
    return { expired: false, reason: 'missing_expired_at' } as const;
  }

  if (order.expired_at.getTime() > Date.now()) {
    return { expired: false, reason: 'not_due' } as const;
  }

  if (order.order_status !== OrderStatus.PENDING_PAYMENT) {
    return { expired: false, reason: 'order_not_pending' } as const;
  }

  await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        order_status: OrderStatus.CANCELED,
      },
    });

    if (order.payment) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: {
          payment_status:
            order.payment.payment_status === 'succeeded'
              ? order.payment.payment_status
              : 'canceled',
        },
      });
    }

    await syncExperienceCalendarForOrderStatus(
      tx,
      getExperienceOrderItems(order.order_items),
      OrderStatus.CANCELED
    );
  });

  return { expired: true, orderId: order.id } as const;
}

export async function createExperienceCheckout(
  input: CreateExperienceCheckoutInput
): Promise<CreatedExperienceCheckout> {
  const experience = await getPurchasableExperienceById(input.experienceId);
  if (!experience) {
    throw new Error('Experience is not available for checkout.');
  }

  const customerEmail = normalizeCustomerEmail(input.customerEmail);
  const scheduleDate = parseScheduleDate(input.scheduleDate);
  const quote = buildExperiencePurchaseQuote(experience, input.requestedHours);
  const normalizedQuote = toSerializableQuote(quote);
  const scheduleDateOnly = formatDateForPrismaDateField(scheduleDate);
  const scheduleStartTime = formatTimeForPrismaTimeField(
    formatLocalTimeValue(scheduleDate)
  );
  const scheduleEndTime = formatTimeForPrismaTimeField(
    formatLocalTimeValue(
      new Date(
        scheduleDate.getTime() + normalizedQuote.requestedHours * 60 * 60 * 1000
      )
    )
  );

  if (!scheduleStartTime || !scheduleEndTime) {
    throw new Error('Unable to normalize schedule time for checkout.');
  }
  const stripe = getStripeServerClient();
  const stripeCustomer = await stripe.customers.create({
    email: customerEmail,
    name: normalizeCustomerName(input.customerName),
    metadata: {
      clerkUserId: input.clerkUserId,
    },
  });
  const { userId } = await upsertClerkUser(input.clerkUserId, customerEmail);
  const expiredAt = new Date(Date.now() + ORDER_EXPIRY_HOURS * 60 * 60 * 1000);

  const { order, payment } = await prisma.$transaction(async tx => {
    await assertExperienceScheduleAvailable(tx, experience.id, scheduleDate);

    const payment = await tx.payment.create({
      data: {
        order_amount: normalizedQuote.totalAmountCad,
        gst_rate: null,
        pst_rate: null,
        hst_rate: null,
        grand_total: normalizedQuote.totalAmountCad,
        gst_amount: null,
        hst_amount: null,
        payment_method: PAYMENT_METHOD_PLACEHOLDER,
        customer_id: stripeCustomer.id,
        customer_email: customerEmail,
        payment_status: 'pending',
      },
      select: {
        id: true,
      },
    });

    const order = await tx.order.create({
      data: {
        proposal_id: input.proposalId ?? null,
        user_id: userId,
        order_status: OrderStatus.PENDING_PAYMENT,
        payment_id: payment.id,
        expired_at: expiredAt,
      },
      select: {
        id: true,
      },
    });

    await tx.orderItem.create({
      data: {
        order_id: order.id,
        item_type: 'EXPERIENCE',
        experience_id: experience.id,
        item_price: normalizedQuote.totalAmountCad,
        schedule_date: scheduleDateOnly,
        start_time: scheduleStartTime,
        end_time: scheduleEndTime,
      },
    });

    await lockExperienceScheduleDate(tx, experience.id, scheduleDate);

    return { order, payment };
  });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeAmountCents(normalizedQuote.totalAmountCad),
      currency: 'cad',
      automatic_payment_methods: {
        enabled: true,
      },
      customer: stripeCustomer.id,
      receipt_email: customerEmail,
      description: `${experience.experienceTitle} booking`,
      metadata: {
        orderId: String(order.id),
        paymentId: String(payment.id),
        clerkUserId: input.clerkUserId,
        experienceId: String(experience.id),
        experienceTitle: experience.experienceTitle,
        requestedHours: String(getRequestedHoursFromQuote(normalizedQuote)),
        scheduleDate: scheduleDate.toISOString(),
        totalAmountCad: String(normalizedQuote.totalAmountCad),
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Stripe did not return a client secret.');
    }

    try {
      await scheduleExperienceOrderExpiry(order.id);
    } catch (scheduleError) {
      logger.warn(
        {
          error: scheduleError,
          orderId: order.id,
        },
        'Failed to schedule experience order expiry task'
      );
    }

    return {
      orderId: order.id,
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      expiresAt: expiredAt.toISOString(),
      quote: normalizedQuote,
    };
  } catch (error) {
    await prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { payment_status: 'failed' },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { order_status: OrderStatus.PAYMENT_FAILED },
      });

      await tx.experienceCalendar.deleteMany({
        where: {
          experience_id: experience.id,
          schedule_date: scheduleDate,
          calendar_status: EXPERIENCE_CALENDAR_STATUS.LOCKED,
        },
      });
    });

    throw error;
  }
}

export async function createEventCheckout(
  input: CreateEventCheckoutInput
): Promise<CreatedEventCheckout> {
  const customerEmail = normalizeCustomerEmail(input.customerEmail);
  const amountCad = Number(input.total);
  const quantity = Number(input.quantity);
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

  if (!Number.isInteger(input.eventId) || input.eventId <= 0) {
    throw new Error('Invalid event id.');
  }

  if (!Number.isInteger(input.calendarId) || input.calendarId <= 0) {
    throw new Error('Invalid event calendar id.');
  }

  if (!Number.isFinite(amountCad) || amountCad <= 0) {
    throw new Error('Invalid checkout amount.');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Invalid ticket quantity.');
  }

  if (normalizedTickets.length === 0) {
    throw new Error('At least one ticket type is required.');
  }

  const stripe = getStripeServerClient();

  const eventCalendar = await prisma.eventCalendar.findFirst({
    where: {
      id: input.calendarId,
      event_id: input.eventId,
      date_status: 'VALID',
    },
    select: {
      id: true,
      event_date: true,
      start_time: true,
      end_time: true,
      event: {
        select: {
          eventTitle: true,
        },
      },
    },
  });

  if (!eventCalendar) {
    throw new Error('Selected event date is not available.');
  }

  const eventPricingRows = await prisma.eventPricing.findMany({
    where: {
      event_id: input.eventId,
    },
    select: {
      id: true,
      price_level: true,
      event_price: true,
    },
  });

  const eventPriceById = new Map<
    number,
    { priceLevel: string; unitPrice: number }
  >(
    eventPricingRows.map(row => [
      row.id,
      {
        priceLevel: String(row.price_level),
        unitPrice: Number(row.event_price.toString()),
      },
    ])
  );

  const orderItemLines = normalizedTickets.map(ticket => {
    const pricing = eventPriceById.get(ticket.priceId);

    if (!pricing || !Number.isFinite(pricing.unitPrice)) {
      throw new Error(`Ticket price ${ticket.priceId} is not available.`);
    }

    return {
      ticketName: pricing.priceLevel,
      itemPrice: pricing.unitPrice,
      itemQuantity: ticket.qty,
      lineTotal: pricing.unitPrice * ticket.qty,
    };
  });

  const expectedQuantity = orderItemLines.reduce(
    (sum, line) => sum + line.itemQuantity,
    0
  );
  const expectedAmountCad = orderItemLines.reduce(
    (sum, line) => sum + line.lineTotal,
    0
  );

  if (expectedQuantity !== quantity) {
    throw new Error('Ticket quantity mismatch. Please refresh and try again.');
  }

  if (expectedAmountCad !== amountCad) {
    throw new Error('Ticket total mismatch. Please refresh and try again.');
  }

  const stripeCustomer = await stripe.customers.create({
    email: customerEmail,
    name: normalizeCustomerName(input.customerName),
    metadata: {
      clerkUserId: input.clerkUserId,
    },
  });

  const { userId } = await upsertClerkUser(input.clerkUserId, customerEmail);

  const { order, payment } = await prisma.$transaction(async tx => {
    const payment = await tx.payment.create({
      data: {
        order_amount: amountCad,
        gst_rate: null,
        pst_rate: null,
        hst_rate: null,
        grand_total: amountCad,
        gst_amount: null,
        hst_amount: null,
        payment_method: PAYMENT_METHOD_PLACEHOLDER,
        customer_id: stripeCustomer.id,
        customer_email: customerEmail,
        payment_status: 'pending',
      },
      select: {
        id: true,
      },
    });

    const order = await tx.order.create({
      data: {
        proposal_id: null,
        user_id: userId,
        order_status: OrderStatus.PENDING_PAYMENT,
        payment_id: payment.id,
        expired_at: null,
      },
      select: {
        id: true,
      },
    });

    await tx.orderItem.createMany({
      data: orderItemLines.map(line => ({
        order_id: order.id,
        item_type: 'EVENT',
        event_id: input.eventId,
        item_price: line.itemPrice,
        item_quantity: line.itemQuantity,
        schedule_date: eventCalendar.event_date,
        start_time: eventCalendar.start_time,
        end_time: eventCalendar.end_time,
      })),
    });

    return { order, payment };
  });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeAmountCents(amountCad),
      currency: 'cad',
      customer: stripeCustomer.id,
      receipt_email: customerEmail,
      description: `${eventCalendar.event.eventTitle} booking`,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        flow: 'event_checkout',
        orderId: String(order.id),
        paymentId: String(payment.id),
        eventId: String(input.eventId),
        calendarId: String(eventCalendar.id),
        eventDate: formatDateForPrismaDateField(
          eventCalendar.event_date
        ).toISOString(),
        quantity: String(quantity),
        clerkUserId: input.clerkUserId,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Unable to initialize payment.');
    }

    return {
      orderId: order.id,
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amountCad,
    };
  } catch (error) {
    await prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          payment_status: 'failed',
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          order_status: OrderStatus.PAYMENT_FAILED,
        },
      });
    });

    throw error;
  }
}

export async function syncExperienceOrderPayment(params: {
  orderId: number;
  clerkUserId: string;
  paymentIntentId?: string | null;
}): Promise<ExperienceOrderResult | null> {
  if (!Number.isInteger(params.orderId) || params.orderId <= 0) {
    return null;
  }

  const existingOrder = await getOwnedOrder(params.orderId, params.clerkUserId);
  if (!existingOrder) return null;

  if (!params.paymentIntentId) {
    return buildOrderResult(existingOrder);
  }

  const stripe = getStripeServerClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(
    params.paymentIntentId
  );

  if (paymentIntent.metadata.orderId !== String(existingOrder.id)) {
    throw new Error('Payment intent does not belong to this order.');
  }

  await applyStripePaymentIntentSync(existingOrder.id, paymentIntent);

  const refreshedOrder = await getOwnedOrder(
    params.orderId,
    params.clerkUserId
  );
  return refreshedOrder ? buildOrderResult(refreshedOrder) : null;
}

export async function syncExperienceOrderPaymentByWebhook(
  paymentIntent: Stripe.PaymentIntent
): Promise<number | null> {
  const orderId = Number.parseInt(paymentIntent.metadata.orderId ?? '', 10);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return null;
  }

  await applyStripePaymentIntentSync(orderId, paymentIntent);
  return orderId;
}

export async function syncEventOrderPayment(params: {
  orderId: number;
  clerkUserId: string;
  paymentIntentId?: string | null;
}): Promise<{
  orderId: number;
  orderStatus: OrderStatus;
  paymentStatus: string | null;
} | null> {
  if (!Number.isInteger(params.orderId) || params.orderId <= 0) {
    return null;
  }

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      user: { clerk_id: params.clerkUserId },
    },
    select: {
      id: true,
      order_status: true,
      payment: {
        select: {
          payment_status: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  if (!params.paymentIntentId) {
    return {
      orderId: order.id,
      orderStatus: order.order_status,
      paymentStatus: order.payment?.payment_status ?? null,
    };
  }

  const stripe = getStripeServerClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(
    params.paymentIntentId
  );

  if (paymentIntent.metadata.orderId !== String(order.id)) {
    throw new Error('Payment intent does not belong to this order.');
  }

  await applyStripePaymentIntentSync(order.id, paymentIntent);

  const refreshedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: {
      id: true,
      order_status: true,
      payment: {
        select: {
          payment_status: true,
        },
      },
    },
  });

  if (!refreshedOrder) {
    return null;
  }

  return {
    orderId: refreshedOrder.id,
    orderStatus: refreshedOrder.order_status,
    paymentStatus: refreshedOrder.payment?.payment_status ?? null,
  };
}
