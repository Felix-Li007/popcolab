jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/services/clerk-service', () => ({
  getCurrentAuthContext: jest.fn(),
  updateClerkUserProfileName: jest.fn(),
}));

jest.mock('@/services/user-service', () => ({
  upsertClerkUser: jest.fn(),
}));

jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      upsert: jest.fn(),
    },
  },
}));

import { revalidatePath } from 'next/cache';
import {
  getCurrentAuthContext,
  updateClerkUserProfileName,
} from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import { prisma } from '@/libs/prisma-client';
import {
  getProfileAction,
  updateProfileAction,
} from '@/actions/profile-actions';

const getCurrentAuthContextMock = getCurrentAuthContext as jest.MockedFunction<
  typeof getCurrentAuthContext
>;
const updateClerkUserProfileNameMock =
  updateClerkUserProfileName as jest.MockedFunction<
    typeof updateClerkUserProfileName
  >;
const revalidatePathMock = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;
const upsertClerkUserMock = upsertClerkUser as jest.MockedFunction<
  typeof upsertClerkUser
>;

type MockedPrisma = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  profile: {
    upsert: jest.Mock;
  };
};

const prismaMock = prisma as unknown as MockedPrisma;

describe('profile-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getCurrentAuthContextMock.mockResolvedValue({
      isAuthenticated: true,
      user: {
        id: 'clerk_123',
        firstName: 'Clerk',
        lastName: 'User',
        primaryEmailAddressId: 'email_primary',
        emailAddresses: [
          { id: 'email_primary', emailAddress: 'owner@example.com' },
        ],
      },
    } as never);

    prismaMock.user.findUnique.mockResolvedValue({ id: 42 });
    prismaMock.user.update.mockResolvedValue({ id: 42 });
    prismaMock.profile.upsert.mockResolvedValue({ id: 99 });
    upsertClerkUserMock.mockResolvedValue({ userId: 42 } as never);
  });

  test('getProfileAction prefers stored profile names over Clerk names', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 42,
      email: 'owner@example.com',
      user_name: 'fengar',
      profile: {
        id: 99,
        user_id: 42,
        first_name: 'Stored',
        last_name: 'Name',
        phone_number: '204-555-0100',
        preferred_contact: 'phone',
        short_bio: 'Stored bio',
        consent_given: 1,
        privacy_notes: 'Stored notes',
        created_at: new Date('2026-03-01T00:00:00.000Z'),
        updated_at: new Date('2026-03-02T00:00:00.000Z'),
      },
    });

    await expect(getProfileAction()).resolves.toEqual({
      profileId: 99,
      userId: 42,
      email: 'owner@example.com',
      userName: 'fengar',
      firstName: 'Stored',
      lastName: 'Name',
      phoneNumber: '204-555-0100',
      preferredContact: 'phone',
      shortBio: 'Stored bio',
      consentGiven: true,
      privacyNotes: 'Stored notes',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-02T00:00:00.000Z'),
    });

    expect(upsertClerkUserMock).toHaveBeenCalledWith(
      'clerk_123',
      'owner@example.com'
    );
  });

  test('getProfileAction falls back to Clerk names when no stored profile exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 42,
      email: 'owner@example.com',
      user_name: null,
      profile: null,
    });

    await expect(getProfileAction()).resolves.toEqual({
      profileId: null,
      userId: 42,
      email: 'owner@example.com',
      userName: 'owner',
      firstName: 'Clerk',
      lastName: 'User',
      phoneNumber: null,
      preferredContact: null,
      shortBio: null,
      consentGiven: false,
      privacyNotes: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  test('updateProfileAction syncs first and last name to Clerk before saving profile data', async () => {
    const result = await updateProfileAction({
      userName: 'fengar',
      firstName: 'Feng',
      lastName: 'Li',
      phoneNumber: '',
      preferredContact: '',
      shortBio: '',
      consentGiven: true,
      privacyNotes: '',
    });

    expect(result).toEqual({ success: true });
    expect(updateClerkUserProfileNameMock).toHaveBeenCalledWith('clerk_123', {
      firstName: 'Feng',
      lastName: 'Li',
    });
    expect(prismaMock.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          first_name: 'Feng',
          last_name: 'Li',
        }),
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard');
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/profile');
  });

  test('updateProfileAction returns an error when syncing the Clerk profile name fails', async () => {
    updateClerkUserProfileNameMock.mockRejectedValue(new Error('Clerk failed'));

    const result = await updateProfileAction({
      userName: 'fengar',
      firstName: 'Feng',
      lastName: 'Li',
      phoneNumber: '',
      preferredContact: '',
      shortBio: '',
      consentGiven: true,
      privacyNotes: '',
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to save profile. Please try again.',
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.profile.upsert).not.toHaveBeenCalled();
  });
});
