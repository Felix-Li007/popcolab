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
};

export async function getTeamInviteByToken(
  token: string
): Promise<TeamInviteLookupResult | null> {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
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

  return {
    id: invite.id,
    teamId: invite.team.id,
    teamName: invite.team.team_name,
    inviterName,
    email: invite.email,
    status: invite.status,
    expiresAt: invite.expires_at,
    isExpired,
  };
}
