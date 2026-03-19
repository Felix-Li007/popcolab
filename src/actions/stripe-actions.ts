'use server';

import { getCurrentAuthContext } from '@/services/clerk-service';
import {
  createExperienceCheckout,
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
