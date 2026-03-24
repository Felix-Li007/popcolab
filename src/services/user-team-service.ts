import 'server-only';

import { randomBytes } from 'crypto';
import { prisma } from '@/libs/prisma-client';
import { TeamInviteStatus } from '@/libs/prisma/client';
import { sendResendEmail } from '@/services/resend-service';
import { TeamInviteEmail } from '@/emails/templates/team-invite-template';
import {
  buildTeamInviteAbsoluteUrl,
  getFallbackAppBaseUrl,
} from '@/utils/url-helper';

export type UserTeamMember = {
  initials: string;
  color: string;
};

export type UserTeamItem = {
  id: number;
  name: string;
  department: string | null;
  description: string | null;
  isLead: boolean;
  members: UserTeamMember[];
};

export type PendingTeamInvite = {
  id: number;
  teamName: string;
  inviterName: string;
  inviterUsername: string | null;
  createdAt: Date;
};

const AVATAR_COLORS = [
  '#E91E8C',
  '#7c3aed',
  '#0f766e',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
];

function getColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  const first = firstName?.trim()[0] ?? '';
  const last = lastName?.trim()[0] ?? '';
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  return email[0]?.toUpperCase() ?? '?';
}

export async function getUserTeams(userId: number): Promise<UserTeamItem[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      created_teams: {
        select: {
          id: true,
          team_name: true,
          team_department: true,
          team_notes: true,
          created_by: true,
          team_mates: {
            select: {
              user: {
                select: {
                  profile: { select: { first_name: true, last_name: true } },
                  email: true,
                },
              },
            },
            take: 5,
          },
        },
        orderBy: { created_at: 'desc' },
      },
      team_mates: {
        select: {
          team: {
            select: {
              id: true,
              team_name: true,
              team_department: true,
              team_notes: true,
              created_by: true,
              team_mates: {
                select: {
                  user: {
                    select: {
                      profile: {
                        select: { first_name: true, last_name: true },
                      },
                      email: true,
                    },
                  },
                },
                take: 5,
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!user) return [];

  const seen = new Set<number>();
  const teams: UserTeamItem[] = [];

  const mapTeam = (
    team: {
      id: number;
      team_name: string;
      team_department: string | null;
      team_notes: string | null;
      created_by: number;
      team_mates: {
        user: {
          email: string;
          profile: {
            first_name: string | null;
            last_name: string | null;
          } | null;
        };
      }[];
    },
    isLead: boolean
  ): UserTeamItem => ({
    id: team.id,
    name: team.team_name,
    department: team.team_department,
    description: team.team_notes,
    isLead,
    members: team.team_mates.map((tm, i) => ({
      initials: getInitials(
        tm.user.profile?.first_name ?? null,
        tm.user.profile?.last_name ?? null,
        tm.user.email
      ),
      color: getColor(i),
    })),
  });

  for (const team of user.created_teams) {
    if (!seen.has(team.id)) {
      seen.add(team.id);
      teams.push(mapTeam(team, true));
    }
  }

  for (const tm of user.team_mates) {
    if (!seen.has(tm.team.id)) {
      seen.add(tm.team.id);
      teams.push(mapTeam(tm.team, tm.team.created_by === userId));
    }
  }

  return teams;
}

export async function getPendingTeamInvites(
  userEmail: string,
  userName: string | null
): Promise<PendingTeamInvite[]> {
  const invites = await prisma.teamInvite.findMany({
    where: {
      status: TeamInviteStatus.pending,
      OR: [{ email: userEmail }, ...(userName ? [{ username: userName }] : [])],
    },
    select: {
      id: true,
      created_at: true,
      team: { select: { team_name: true } },
      inviter: {
        select: {
          user_name: true,
          profile: { select: { first_name: true, last_name: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return invites.map(inv => {
    const { first_name, last_name } = inv.inviter.profile ?? {};
    const inviterName =
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      inv.inviter.user_name ||
      'A teammate';

    return {
      id: inv.id,
      teamName: inv.team.team_name,
      inviterName,
      inviterUsername: inv.inviter.user_name,
      createdAt: inv.created_at,
    };
  });
}

export async function createTeamWithInvites(params: {
  userId: number;
  name: string;
  department: string | null;
  description: string | null;
  invitees: { value: string }[];
}): Promise<number> {
  const team = await prisma.team.create({
    data: {
      team_name: params.name,
      team_department: params.department,
      team_notes: params.description,
      created_by: params.userId,
    },
    select: { id: true },
  });

  if (params.invitees.length > 0) {
    const inviteData = params.invitees.map(inv => {
      const isEmail = inv.value.includes('@') && !inv.value.startsWith('@');
      return {
        team_id: team.id,
        invited_by: params.userId,
        email: isEmail ? inv.value : '',
        username: isEmail ? null : inv.value.replace(/^@/, ''),
        token: randomBytes(24).toString('hex'),
        status: TeamInviteStatus.pending,
      };
    });

    await prisma.teamInvite.createMany({
      data: inviteData,
      skipDuplicates: true,
    });

    const appBaseUrl = getFallbackAppBaseUrl();
    if (!appBaseUrl) {
      console.error(
        '[team-invite] NEXT_PUBLIC_APP_URL is not set — skipping email send.'
      );
    }
    if (appBaseUrl) {
      const inviter = await prisma.user.findUnique({
        where: { id: params.userId },
        select: {
          user_name: true,
          profile: { select: { first_name: true, last_name: true } },
        },
      });

      const inviterName =
        [inviter?.profile?.first_name, inviter?.profile?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        inviter?.user_name ||
        'A teammate';

      const from = process.env.RESEND_FROM_EMAIL ?? '';

      const results = await Promise.allSettled(
        inviteData.map(async inv => {
          let recipientEmail = inv.email;

          if (!recipientEmail && inv.username) {
            const user = await prisma.user.findFirst({
              where: { user_name: inv.username },
              select: { email: true },
            });
            recipientEmail = user?.email ?? '';
          }

          if (!recipientEmail) return;

          const joinUrl = buildTeamInviteAbsoluteUrl(appBaseUrl, inv.token);

          await sendResendEmail({
            to: recipientEmail,
            from,
            subject: `You've been invited to join ${params.name} on Pop CoLab`,
            react: TeamInviteEmail({
              inviteeName: recipientEmail,
              teamName: params.name,
              inviterName,
              joinUrl,
            }),
          });
        })
      );
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(
            `[team-invite] Failed to send email to invitee[${i}]:`,
            r.reason
          );
        }
      });
    }
  }

  return team.id;
}

export async function deleteTeam(
  teamId: number,
  userId: number
): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { created_by: true },
  });
  if (!team || team.created_by !== userId) {
    throw new Error('Not authorised to delete this team.');
  }
  await prisma.teamInvite.deleteMany({ where: { team_id: teamId } });
  await prisma.teamMate.deleteMany({ where: { team_id: teamId } });
  await prisma.team.delete({ where: { id: teamId } });
}

export async function respondToTeamInvite(
  inviteId: number,
  userId: number,
  userEmail: string,
  action: 'accept' | 'reject'
): Promise<void> {
  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    select: { team_id: true, email: true, username: true, status: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { user_name: true },
  });

  if (!invite) throw new Error('Invite not found.');
  if (invite.status !== TeamInviteStatus.pending) return;

  const emailMatch = invite.email === userEmail;
  const usernameMatch = invite.username && user?.user_name === invite.username;
  if (!emailMatch && !usernameMatch) throw new Error('Not authorised.');

  const nextStatus =
    action === 'accept' ? TeamInviteStatus.accepted : TeamInviteStatus.rejected;

  await prisma.teamInvite.update({
    where: { id: inviteId },
    data: { status: nextStatus },
  });

  if (action === 'accept') {
    const existing = await prisma.teamMate.findFirst({
      where: { team_id: invite.team_id, user_id: userId },
      select: { id: true },
    });
    if (!existing) {
      await prisma.teamMate.create({
        data: { team_id: invite.team_id, user_id: userId },
      });
    }
  }
}
