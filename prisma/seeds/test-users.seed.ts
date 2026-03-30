import { PrismaClient } from '@/libs/prisma/client';

type SeedUserRow = {
  email: string;
  clerkId: string;
  userName: string;
};

const testUserSeedRows: SeedUserRow[] = [
  {
    email: 'ricklee586@gmail.com',
    clerkId: 'seed-event-cancel-tester',
    userName: 'Event Cancel Tester',
  },
];

export type SeedUserRecord = {
  id: number;
  email: string;
  userName: string;
};

export async function seedTestUsers(
  prisma: PrismaClient
): Promise<Map<string, SeedUserRecord>> {
  const users = new Map<string, SeedUserRecord>();

  for (const row of testUserSeedRows) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerk_id: row.clerkId }, { email: row.email }],
      },
      select: {
        id: true,
      },
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            clerk_id: row.clerkId,
            email: row.email,
            user_name: row.userName,
          },
          select: {
            id: true,
            email: true,
            user_name: true,
          },
        })
      : await prisma.user.create({
          data: {
            clerk_id: row.clerkId,
            email: row.email,
            user_name: row.userName,
          },
          select: {
            id: true,
            email: true,
            user_name: true,
          },
        });

    users.set(row.email, {
      id: user.id,
      email: user.email,
      userName: user.user_name ?? row.userName,
    });

    console.log(`Created/updated test user: ${row.email}`);
  }

  return users;
}
