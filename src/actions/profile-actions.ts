'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { prisma } from '@/libs/prisma-client';

export type UserProfileData = {
  email: string;
  userName: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  preferredContact: string | null;
};

export type UpdateProfileInput = {
  userName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  preferredContact: string;
};

export type UpdateProfileResult = {
  success: boolean;
  error?: string;
};

export async function getProfileAction(): Promise<UserProfileData | null> {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) return null;

  const user = await prisma.user.findUnique({
    where: { clerk_id: authContext.user.id },
    select: {
      email: true,
      user_name: true,
      profile: {
        select: {
          first_name: true,
          last_name: true,
          phone_number: true,
          preferred_contact: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    email: user.email,
<<<<<<< feature/optimize-admin-dashbaord
    userName: user.user_name ?? user.email.split('@')[0] ?? 'user',
=======
    userName: user.user_name,
>>>>>>> main
    firstName: user.profile?.first_name ?? null,
    lastName: user.profile?.last_name ?? null,
    phoneNumber: user.profile?.phone_number ?? null,
    preferredContact: user.profile?.preferred_contact ?? null,
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

  if (!userName) return { success: false, error: 'Username is required.' };
  if (userName.length > 50)
    return {
      success: false,
      error: 'Username must be 50 characters or fewer.',
    };

  try {
    const user = await prisma.user.findUnique({
      where: { clerk_id: authContext.user.id },
      select: { id: true },
    });

    if (!user) return { success: false, error: 'User not found.' };

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
      },
      create: {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        preferred_contact: preferredContact,
        consent_given: 1,
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
