'use server';
import { getCurrentAuthContext } from '@/services/clerk-service';
import {
  createEventCheckout,
  createExperienceCheckout,
  syncEventOrderPayment,
  type CreatedEventCheckout,
  type CreatedExperienceCheckout,
} from '@/services/order-service';

export type CreateExperienceCheckoutInput = {
  experienceId: number;
  requestedHours: number;
  scheduleDate: string;
  proposalId?: number | null;
};

function getVerifiedCheckoutEmail(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentAuthContext>>['user']>
): string | null {
  const primaryEmail = user.emailAddresses.find(
    value => value.id === user.primaryEmailAddressId
  );

  if (primaryEmail?.verification?.status === 'verified') {
    return primaryEmail.emailAddress;
  }

  const verifiedEmail = user.emailAddresses.find(
    value => value.verification?.status === 'verified'
  );

  return verifiedEmail?.emailAddress ?? null;
}

export async function createExperienceCheckoutAction(
  input: CreateExperienceCheckoutInput
): Promise<CreatedExperienceCheckout> {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    throw new Error('Authentication required.');
  }

  const email = getVerifiedCheckoutEmail(authContext.user);

  if (!email) {
    throw new Error('A verified email address is required for checkout.');
  }

  const firstName = authContext.user.firstName?.trim() ?? '';
  const lastName = authContext.user.lastName?.trim() ?? '';
  const customerName = `${firstName} ${lastName}`.trim();

  return createExperienceCheckout({
    clerkUserId: authContext.user.id,
    customerEmail: email,
    customerName,
    experienceId: input.experienceId,
    requestedHours: input.requestedHours,
    scheduleDate: input.scheduleDate,
    proposalId: input.proposalId ?? null,
  });
}

export type CreateEventPaymentIntentInput = {
  eventId: number;
  calendarId: number;
  quantity: number;
  total: number;
  tickets: Array<{
    priceId: number;
    qty: number;
  }>;
};

export type CreatedEventPaymentIntent = CreatedEventCheckout;

export async function createEventPaymentIntentAction(
  input: CreateEventPaymentIntentInput
): Promise<CreatedEventPaymentIntent> {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    throw new Error('Authentication required.');
  }

  const email = getVerifiedCheckoutEmail(authContext.user);
  if (!email) {
    throw new Error('A verified email address is required for checkout.');
  }

  const firstName = authContext.user.firstName?.trim() ?? '';
  const lastName = authContext.user.lastName?.trim() ?? '';
  const customerName = `${firstName} ${lastName}`.trim();

  return createEventCheckout({
    clerkUserId: authContext.user.id,
    customerEmail: email,
    customerName,
    eventId: input.eventId,
    calendarId: input.calendarId,
    quantity: input.quantity,
    total: input.total,
    tickets: input.tickets,
  });
}

export async function syncEventOrderPaymentAction(input: {
  orderId: number;
  paymentIntentId?: string | null;
}) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    throw new Error('Authentication required.');
  }

  return syncEventOrderPayment({
    orderId: input.orderId,
    paymentIntentId: input.paymentIntentId,
    clerkUserId: authContext.user.id,
  });
}
