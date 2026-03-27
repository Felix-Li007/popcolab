jest.mock('server-only', () => ({}));

jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    payment: {
      update: jest.fn(),
    },
    experienceCalendar: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/libs/prisma/client', () => ({
  CalendarStatus: {
    LOCKED: 'locked',
    BLOCKED: 'blocked',
  },
  ProcessStatus: {
    PROGRESS: 'PROGRESS',
  },
  Prisma: {},
}));

jest.mock('@/libs/qstash-client', () => ({
  getQStashClient: jest.fn(),
  getQStashEndpointUrl: jest.fn(),
}));

jest.mock('@/libs/stripe-server', () => ({
  getStripeServerClient: jest.fn(),
  toStripeAmountCents: jest.fn((amount: number) => amount * 100),
}));

jest.mock('@/services/experience-service', () => ({
  buildExperiencePurchaseQuote: jest.fn(),
  getPurchasableExperienceById: jest.fn(),
}));

jest.mock('@/services/user-service', () => ({
  upsertClerkUser: jest.fn(),
}));

jest.mock('@/utils/logging-util', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

import { prisma } from '@/libs/prisma-client';
import { getStripeServerClient } from '@/libs/stripe-server';
import {
  buildExperiencePurchaseQuote,
  getPurchasableExperienceById,
} from '@/services/experience-service';
import {
  createExperienceCheckout,
  syncExperienceOrderPaymentByWebhook,
} from '@/services/order-service';
import { upsertClerkUser } from '@/services/user-service';

type MockedPrisma = {
  order: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
  };
  payment: {
    update: jest.Mock;
  };
  experienceCalendar: {
    deleteMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

const prismaMock = prisma as unknown as MockedPrisma;
const getStripeServerClientMock = getStripeServerClient as jest.MockedFunction<
  typeof getStripeServerClient
>;
const getPurchasableExperienceByIdMock =
  getPurchasableExperienceById as jest.MockedFunction<
    typeof getPurchasableExperienceById
  >;
const buildExperiencePurchaseQuoteMock =
  buildExperiencePurchaseQuote as jest.MockedFunction<
    typeof buildExperiencePurchaseQuote
  >;
const upsertClerkUserMock = upsertClerkUser as jest.MockedFunction<
  typeof upsertClerkUser
>;

function createSlotUniqueError(
  target: unknown = ['experience_id', 'schedule_date']
) {
  return {
    code: 'P2002',
    meta: {
      target,
    },
  };
}

describe('order-service booking slot locking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-19T12:00:00.000Z'));

    getPurchasableExperienceByIdMock.mockResolvedValue({
      id: 7,
      experienceTitle: 'Facilitated workshop',
    } as never);
    buildExperiencePurchaseQuoteMock.mockReturnValue({
      currency: 'CAD',
      requestedHours: 2,
      includedHours: 2,
      extraHours: 0,
      baseAmountCad: 300,
      extraAmountCad: 0,
      totalAmountCad: 300,
    } as never);
    upsertClerkUserMock.mockResolvedValue({ userId: 21 } as never);

    getStripeServerClientMock.mockReturnValue({
      customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
      },
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('createExperienceCheckout converts slot unique races into a temporary lock message', async () => {
    const tx = {
      experienceCalendar: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ calendar_status: 'locked' }),
        create: jest.fn().mockRejectedValue(createSlotUniqueError()),
      },
      payment: {
        create: jest.fn().mockResolvedValue({ id: 101 }),
      },
      order: {
        create: jest.fn().mockResolvedValue({ id: 202 }),
      },
      orderItem: {
        create: jest.fn().mockResolvedValue({ id: 303 }),
      },
    };

    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    await expect(
      createExperienceCheckout({
        clerkUserId: 'clerk_123',
        customerEmail: 'owner@example.com',
        customerName: 'Owner Example',
        experienceId: 7,
        requestedHours: 2,
        scheduleDate: '2026-03-20T15:00:00.000Z',
      })
    ).rejects.toThrow(
      'This schedule date is temporarily locked by another order.'
    );
  });

  test('createExperienceCheckout converts slot unique races into an already booked message when the slot is blocked', async () => {
    const tx = {
      experienceCalendar: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ calendar_status: 'blocked' }),
        create: jest.fn().mockRejectedValue(createSlotUniqueError()),
      },
      payment: {
        create: jest.fn().mockResolvedValue({ id: 101 }),
      },
      order: {
        create: jest.fn().mockResolvedValue({ id: 202 }),
      },
      orderItem: {
        create: jest.fn().mockResolvedValue({ id: 303 }),
      },
    };

    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    await expect(
      createExperienceCheckout({
        clerkUserId: 'clerk_123',
        customerEmail: 'owner@example.com',
        customerName: 'Owner Example',
        experienceId: 7,
        requestedHours: 2,
        scheduleDate: '2026-03-20T15:00:00.000Z',
      })
    ).rejects.toThrow('This schedule date has already been booked.');
  });

  test('syncExperienceOrderPaymentByWebhook falls back to updating the slot when creating a blocked row hits the unique constraint', async () => {
    const tx = {
      payment: {
        update: jest.fn().mockResolvedValue({ id: 5 }),
      },
      order: {
        update: jest.fn().mockResolvedValue({ id: 9 }),
      },
      userExperience: {
        upsert: jest.fn().mockResolvedValue({ id: 11 }),
      },
      experienceCalendar: {
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 0 })
          .mockResolvedValueOnce({ count: 1 }),
        create: jest.fn().mockRejectedValue(createSlotUniqueError()),
      },
    };

    prismaMock.order.findUnique.mockResolvedValue({
      id: 9,
      expired_at: new Date('2026-03-20T12:00:00.000Z'),
      payment: {
        id: 5,
        payment_status: 'pending',
        payment_method: 'stripe',
        customer_id: 'cus_123',
        customer_email: 'owner@example.com',
        grand_total: { toString: () => '300' },
      },
      order_items: [
        {
          experience_id: 7,
          schedule_date: new Date('2026-03-20T15:00:00.000Z'),
        },
      ],
    });
    prismaMock.$transaction.mockImplementation(async callback => callback(tx));

    await expect(
      syncExperienceOrderPaymentByWebhook({
        id: 'pi_123',
        status: 'succeeded',
        metadata: {
          orderId: '9',
          paymentId: '5',
        },
        customer: 'cus_123',
        receipt_email: 'owner@example.com',
        amount_received: 30000,
        amount: 30000,
        payment_method_types: ['card'],
      } as never)
    ).resolves.toBe(9);

    expect(tx.experienceCalendar.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        experience_id: 7,
        schedule_date: new Date('2026-03-20T15:00:00.000Z'),
      },
      data: {
        calendar_status: 'blocked',
      },
    });
  });
});
