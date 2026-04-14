import 'server-only';

import { prisma } from '@/libs/prisma-client';

export type AttendeePersonality = {
  name: string;
  email: string;
  inviteStatus: 'pending' | 'accepted' | 'rejected';
  personality: {
    key: string;
    name: string;
    emoji: string;
    accentColor: string | null;
  } | null;
};

export type RequestAttendeesSummary = {
  attendees: AttendeePersonality[];
  dominantPersonality: {
    key: string;
    name: string;
    emoji: string;
    accentColor: string | null;
    count: number;
  } | null;
};

export async function getRequestAttendees(
  requestId: number
): Promise<RequestAttendeesSummary> {
  const invitedUsers = await prisma.invitedUser.findMany({
    where: { request_id: requestId },
    select: {
      user_name: true,
      user_email: true,
      invited_status: true,
    },
    orderBy: { created_at: 'asc' },
  });

  if (invitedUsers.length === 0) {
    return { attendees: [], dominantPersonality: null };
  }

  const emails = invitedUsers.map(u => u.user_email);

  const usersWithVectors = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: {
      email: true,
      user_vector: {
        select: { vector_type: true },
      },
    },
  });

  const personalityKeys = [
    ...new Set(
      usersWithVectors
        .map(u => u.user_vector?.vector_type)
        .filter((k): k is string => Boolean(k))
    ),
  ];

  const personalityTypes =
    personalityKeys.length > 0
      ? await prisma.personalityType.findMany({
          where: { personality_key: { in: personalityKeys } },
          select: {
            personality_key: true,
            personality_name: true,
            emoji: true,
            accent_color: true,
          },
        })
      : [];

  const personalityMap = new Map(
    personalityTypes.map(p => [p.personality_key, p])
  );

  const vectorMap = new Map(
    usersWithVectors.map(u => [u.email, u.user_vector?.vector_type ?? null])
  );

  const attendees: AttendeePersonality[] = invitedUsers.map(inv => {
    const personalityKey = vectorMap.get(inv.user_email) ?? null;
    const personalityRow = personalityKey
      ? personalityMap.get(personalityKey)
      : null;

    return {
      name: inv.user_name,
      email: inv.user_email,
      inviteStatus: inv.invited_status as 'pending' | 'accepted' | 'rejected',
      personality: personalityRow
        ? {
            key: personalityRow.personality_key,
            name: personalityRow.personality_name,
            emoji: personalityRow.emoji ?? '',
            accentColor: personalityRow.accent_color ?? null,
          }
        : null,
    };
  });

  // Tally personalities to find dominant
  const tally = new Map<string, number>();
  for (const a of attendees) {
    if (a.personality) {
      tally.set(a.personality.key, (tally.get(a.personality.key) ?? 0) + 1);
    }
  }

  let dominantPersonality: RequestAttendeesSummary['dominantPersonality'] =
    null;

  if (tally.size > 0) {
    const [topKey, topCount] = [...tally.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topRow = personalityMap.get(topKey);
    if (topRow) {
      dominantPersonality = {
        key: topRow.personality_key,
        name: topRow.personality_name,
        emoji: topRow.emoji ?? '',
        accentColor: topRow.accent_color ?? null,
        count: topCount,
      };
    }
  }

  return { attendees, dominantPersonality };
}
