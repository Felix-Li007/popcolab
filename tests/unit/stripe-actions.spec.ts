jest.mock('@/services/clerk-service', () => ({
  getCurrentAuthContext: jest.fn(),
}));

jest.mock('@/services/order-service', () => ({
  createExperienceCheckout: jest.fn(),
}));

import { getCurrentAuthContext } from '@/services/clerk-service';
import { createExperienceCheckout } from '@/services/order-service';
import { createExperienceCheckoutAction } from '@/actions/stripe-actions';

const getCurrentAuthContextMock = getCurrentAuthContext as jest.MockedFunction<
  typeof getCurrentAuthContext
>;
const createExperienceCheckoutMock =
  createExperienceCheckout as jest.MockedFunction<
    typeof createExperienceCheckout
  >;

function buildEmailAddress(params: {
  id: string;
  emailAddress: string;
  status: 'verified' | 'unverified';
}) {
  return {
    id: params.id,
    emailAddress: params.emailAddress,
    verification:
      params.status === 'verified'
        ? { status: 'verified' }
        : { status: 'failed' },
  };
}

describe('stripe-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses the primary verified Clerk email for checkout', async () => {
    getCurrentAuthContextMock.mockResolvedValue({
      isAuthenticated: true,
      user: {
        id: 'clerk_123',
        firstName: 'Jane',
        lastName: 'Doe',
        primaryEmailAddressId: 'email_primary',
        emailAddresses: [
          buildEmailAddress({
            id: 'email_primary',
            emailAddress: 'jane@example.com',
            status: 'verified',
          }),
        ],
      },
    } as never);
    createExperienceCheckoutMock.mockResolvedValue({
      orderId: 1,
      paymentId: 2,
      paymentIntentId: 'pi_123',
      clientSecret: 'secret_123',
      expiresAt: '2026-03-20T12:00:00.000Z',
      quote: {
        currency: 'CAD',
        requestedHours: 2,
        includedHours: 2,
        extraHours: 0,
        baseAmountCad: 300,
        extraAmountCad: 0,
        totalAmountCad: 300,
      },
    });

    await createExperienceCheckoutAction({
      experienceId: 7,
      requestedHours: 2,
      scheduleDate: '2026-03-20T15:00:00.000Z',
    });

    expect(createExperienceCheckoutMock).toHaveBeenCalledWith({
      clerkUserId: 'clerk_123',
      customerEmail: 'jane@example.com',
      customerName: 'Jane Doe',
      experienceId: 7,
      requestedHours: 2,
      scheduleDate: '2026-03-20T15:00:00.000Z',
      proposalId: null,
    });
  });

  test('falls back to another verified Clerk email when the primary email is not verified', async () => {
    getCurrentAuthContextMock.mockResolvedValue({
      isAuthenticated: true,
      user: {
        id: 'clerk_123',
        firstName: 'Jane',
        lastName: 'Doe',
        primaryEmailAddressId: 'email_primary',
        emailAddresses: [
          buildEmailAddress({
            id: 'email_primary',
            emailAddress: 'pending@example.com',
            status: 'unverified',
          }),
          buildEmailAddress({
            id: 'email_secondary',
            emailAddress: 'verified@example.com',
            status: 'verified',
          }),
        ],
      },
    } as never);
    createExperienceCheckoutMock.mockResolvedValue({
      orderId: 1,
      paymentId: 2,
      paymentIntentId: 'pi_123',
      clientSecret: 'secret_123',
      expiresAt: '2026-03-20T12:00:00.000Z',
      quote: {
        currency: 'CAD',
        requestedHours: 2,
        includedHours: 2,
        extraHours: 0,
        baseAmountCad: 300,
        extraAmountCad: 0,
        totalAmountCad: 300,
      },
    });

    await createExperienceCheckoutAction({
      experienceId: 7,
      requestedHours: 2,
      scheduleDate: '2026-03-20T15:00:00.000Z',
    });

    expect(createExperienceCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'verified@example.com',
      })
    );
  });

  test('throws when the Clerk user has no verified email address', async () => {
    getCurrentAuthContextMock.mockResolvedValue({
      isAuthenticated: true,
      user: {
        id: 'clerk_123',
        firstName: 'Jane',
        lastName: 'Doe',
        primaryEmailAddressId: 'email_primary',
        emailAddresses: [
          buildEmailAddress({
            id: 'email_primary',
            emailAddress: 'pending@example.com',
            status: 'unverified',
          }),
        ],
      },
    } as never);

    await expect(
      createExperienceCheckoutAction({
        experienceId: 7,
        requestedHours: 2,
        scheduleDate: '2026-03-20T15:00:00.000Z',
      })
    ).rejects.toThrow('A verified email address is required for checkout.');

    expect(createExperienceCheckoutMock).not.toHaveBeenCalled();
  });
});
