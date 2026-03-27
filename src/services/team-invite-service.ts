import 'server-only';

import { prisma } from '@/libs/prisma-client';

export type TeamInviteLookupResult = {
  id: number;
  teamId: number;
  teamName: string;
  inviterName: string;
  email: string;
  status: string;
  expiresAt: Date | null;
  isExpired: boolean;
  isExistingUser: boolean;
};

export async function getTeamInviteByToken(
  token: string
): Promise<TeamInviteLookupResult | null> {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      username: true,
      status: true,
      expires_at: true,
      team: {
        select: { id: true, team_name: true },
      },
      inviter: {
        select: {
          user_name: true,
          profile: { select: { first_name: true, last_name: true } },
        },
      },
    },
  });

  if (!invite) return null;

  const isExpired =
    invite.expires_at !== null && invite.expires_at.getTime() < Date.now();

  const { first_name, last_name } = invite.inviter.profile ?? {};
  const inviterName =
    [first_name, last_name].filter(Boolean).join(' ').trim() ||
    invite.inviter.user_name ||
    'A teammate';

  // Determine whether the invitee already has an account
  let isExistingUser = false;
  let email = invite.email;

  if (email) {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    isExistingUser = !!existing;
  } else if (invite.username) {
    const existing = await prisma.user.findFirst({
      where: { user_name: invite.username },
      select: { id: true, email: true },
    });
    if (existing) {
      isExistingUser = true;
      email = existing.email;
    }
  }

  return {
    id: invite.id,
    teamId: invite.team.id,
    teamName: invite.team.team_name,
    inviterName,
    email,
    status: invite.status,
    expiresAt: invite.expires_at,
    isExpired,
    isExistingUser,
  };
}
