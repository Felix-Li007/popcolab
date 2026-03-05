import 'server-only';
import { prisma } from '@/libs/prisma-client';

export async function upsertUserByClerkId(
  clerkId: string,
  email: string,
  userName: string
): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { id: true },
  });

  if (existing) return;

  await prisma.user.create({
    data: {
      clerk_id: clerkId,
      email,
      user_name: userName,
      user_type: 'INDIVIDUAL',
      status: 'active',
      profile: {
        create: {
          consent_given: 1,
        },
      },
    },
  });
}

export async function updateUserEmailByClerkId(
  clerkId: string,
  email: string
): Promise<void> {
  await prisma.user.updateMany({
    where: { clerk_id: clerkId },
    data: { email },
  });
}

export async function deactivateUserByClerkId(clerkId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { clerk_id: clerkId },
    data: { status: 'inactive' },
  });
}
