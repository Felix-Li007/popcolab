'use server';

import { revalidatePath } from 'next/cache';
import {
  getCurrentAuthContext,
  updateClerkUserProfileName,
} from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import { prisma } from '@/libs/prisma-client';

export type UserProfileData = {
  profileId: number | null;
  userId: number;
  email: string;
  userName: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  preferredContact: string | null;
  shortBio: string | null;
  consentGiven: boolean;
  privacyNotes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UpdateProfileInput = {
  userName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  preferredContact: string;
  shortBio: string;
  consentGiven: boolean;
  privacyNotes: string;
};

export type UpdateProfileResult = {
  success: boolean;
  error?: string;
};

export async function getProfileAction(): Promise<UserProfileData | null> {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) return null;

  const clerkUser = authContext.user;
  const primaryEmail =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  // Ensure a DB user row exists for brand-new sign-ups.
  await upsertClerkUser(clerkUser.id, primaryEmail);

  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkUser.id },
    select: {
      id: true,
      email: true,
      user_name: true,
      profile: {
        select: {
          id: true,
          user_id: true,
          first_name: true,
          last_name: true,
          phone_number: true,
          preferred_contact: true,
          short_bio: true,
          consent_given: true,
          privacy_notes: true,
          created_at: true,
          updated_at: true,
        },
      },
    },
  });

  if (!user) return null;
  const hasStoredProfile = Boolean(user.profile);

  return {
    profileId: user.profile?.id ?? null,
    userId: user.id,
    email: user.email,
    userName: user.user_name ?? user.email.split('@')[0] ?? 'user',
    firstName: hasStoredProfile
      ? (user.profile?.first_name ?? null)
      : (clerkUser.firstName ?? null),
    lastName: hasStoredProfile
      ? (user.profile?.last_name ?? null)
      : (clerkUser.lastName ?? null),
    phoneNumber: user.profile?.phone_number ?? null,
    preferredContact: user.profile?.preferred_contact ?? null,
    shortBio: user.profile?.short_bio ?? null,
    consentGiven: Number(user.profile?.consent_given ?? 0) > 0,
    privacyNotes: user.profile?.privacy_notes ?? null,
    createdAt: user.profile?.created_at ?? null,
    updatedAt: user.profile?.updated_at ?? null,
  };
}

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    return { success: false, error: 'Authentication required.' };
  }

  const userName = input.userName.trim();
  const firstName = input.firstName.trim() || null;
  const lastName = input.lastName.trim() || null;
  const phoneNumber = input.phoneNumber.trim() || null;
  const preferredContact = input.preferredContact.trim().toLowerCase() || null;
  const shortBio = input.shortBio.trim() || null;
  const privacyNotes = input.privacyNotes.trim() || null;
  const consentGiven = input.consentGiven ? 1 : 0;

  if (!userName) return { success: false, error: 'Username is required.' };
  if (userName.length > 50)
    return {
      success: false,
      error: 'Username must be 50 characters or fewer.',
    };
  if (shortBio && shortBio.length > 255) {
    return {
      success: false,
      error: 'Short bio must be 255 characters or fewer.',
    };
  }
  if (privacyNotes && privacyNotes.length > 255) {
    return {
      success: false,
      error: 'Privacy notes must be 255 characters or fewer.',
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerk_id: authContext.user.id },
      select: { id: true },
    });

    if (!user) return { success: false, error: 'User not found.' };

    await updateClerkUserProfileName(authContext.user.id, {
      firstName,
      lastName,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { user_name: userName },
    });

    await prisma.profile.upsert({
      where: { user_id: user.id },
      update: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        preferred_contact: preferredContact,
        short_bio: shortBio,
        consent_given: consentGiven,
        privacy_notes: privacyNotes,
      },
      create: {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        preferred_contact: preferredContact,
        short_bio: shortBio,
        consent_given: consentGiven,
        privacy_notes: privacyNotes,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Failed to save profile. Please try again.',
    };
  }
}
