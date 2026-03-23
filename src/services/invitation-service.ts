import 'server-only';

import { randomBytes } from 'node:crypto';
import { RequestInvitationEmail } from '@/emails/templates/request-invitation-template';
import { InviteStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { sendResendEmail } from '@/services/resend-service';
import { buildInvitationAbsoluteUrl } from '@/utils/url-helper';

const USER_NAME_MAX_LENGTH = 50;
const USER_EMAIL_MAX_LENGTH = 255;
const INVITED_TOKEN_BYTES = 24;

export type InvitationRecipientInput = {
  userName: string;
  userEmail: string;
};

export type InvitationRecipient = {
  userName: string;
  userEmail: string;
};

export type InvitationResponseAction = 'accept' | 'reject';
export type InvitationResponseResult =
  | { type: 'expired' }
  | { type: 'rejected' }
  | {
      type: 'accepted';
      userEmail: string;
      authAction: 'sign-in' | 'sign-up';
    };

export type InvitationLookupResult = {
  id: number;
  requestId: number;
  requestCategory: string;
  invitedStatus: InviteStatus;
  userName: string;
  userEmail: string;
  expiredAt: Date | null;
  respondAt: Date | null;
  isExpired: boolean;
};

type InvitationRecord = {
  id: number;
  user_email: string;
  invited_token: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, USER_EMAIL_MAX_LENGTH);
}

function normalizeUserName(value: string, fallbackEmail: string): string {
  const trimmed = value.trim();
  if (trimmed) return trimmed.slice(0, USER_NAME_MAX_LENGTH);

  const emailLocalPart = fallbackEmail.split('@')[0]?.trim();
  if (emailLocalPart) return emailLocalPart.slice(0, USER_NAME_MAX_LENGTH);

  return 'user';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createInvitedToken(): string {
  return randomBytes(INVITED_TOKEN_BYTES).toString('hex');
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function buildAcceptedInvitationResponse(
  userEmail: string
): Promise<InvitationResponseResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  return existingUser
    ? {
        type: 'accepted',
        userEmail,
        authAction: 'sign-in',
      }
    : {
        type: 'accepted',
        userEmail,
        authAction: 'sign-up',
      };
}

function dedupeRecipients(
  recipients: InvitationRecipientInput[]
): InvitationRecipient[] {
  const seen = new Set<string>();
  const normalized: InvitationRecipient[] = [];

  for (const recipient of recipients) {
    const userEmail = normalizeEmail(recipient.userEmail);
    if (!userEmail || !isValidEmail(userEmail) || seen.has(userEmail)) {
      continue;
    }

    seen.add(userEmail);
    normalized.push({
      userEmail,
      userName: normalizeUserName(recipient.userName, userEmail),
    });
  }

  return normalized;
}

export async function sendRequestInvitations(params: {
  clerkUserId: string;
  requestId: number;
  invitations: InvitationRecipientInput[];
  appBaseUrl: string;
}) {
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendFrom) {
    throw new Error('RESEND_FROM_EMAIL is not configured.');
  }

  const recipients = dedupeRecipients(params.invitations);
  if (recipients.length === 0) {
    throw new Error('At least one valid invitation recipient is required.');
  }

  const request = await prisma.request.findFirst({
    where: {
      id: params.requestId,
      user: { clerk_id: params.clerkUserId },
    },
    select: {
      id: true,
      objective_category: true,
      expired_at: true,
    },
  });

  if (!request) {
    throw new Error('Request not found or access denied.');
  }

  const results = await Promise.allSettled(
    recipients.map(async recipient => {
      const existingInvitation = await prisma.invitedUser.findUnique({
        where: {
          request_id_user_email: {
            request_id: request.id,
            user_email: recipient.userEmail,
          },
        },
        select: {
          id: true,
          user_email: true,
          invited_token: true,
        },
      });

      const invitedUser =
        existingInvitation ??
        (await prisma.invitedUser.create({
          data: {
            request_id: request.id,
            invited_status: InviteStatus.pending,
            invited_token: createInvitedToken(),
            user_name: recipient.userName,
            user_email: recipient.userEmail,
            expired_at: request.expired_at,
            respond_at: null,
          },
          select: {
            id: true,
            user_email: true,
            invited_token: true,
          },
        }));

      const inviteUrl = buildInvitationAbsoluteUrl(
        params.appBaseUrl,
        invitedUser.invited_token
      );
      const emailProps = {
        inviteeName: recipient.userName,
        requestCategory: request.objective_category,
        inviteUrl,
      };
      let delivery: { id: string | null };

      try {
        delivery = await sendResendEmail({
          to: recipient.userEmail,
          from: resendFrom,
          subject: `You're invited to join a ${request.objective_category} request`,
          react: RequestInvitationEmail(emailProps),
        });
      } catch (error) {
        if (!existingInvitation) {
          try {
            await prisma.invitedUser.delete({
              where: { id: invitedUser.id },
            });
          } catch (cleanupError) {
            throw new Error(
              `${getErrorMessage(error)} Cleanup failed: ${getErrorMessage(cleanupError)}`
            );
          }
        }

        throw error;
      }

      const persistedInvitation: InvitationRecord = existingInvitation
        ? await prisma.invitedUser.update({
            where: { id: existingInvitation.id },
            data: {
              user_name: recipient.userName,
              invited_status: InviteStatus.pending,
              expired_at: request.expired_at,
              respond_at: null,
            },
            select: {
              id: true,
              user_email: true,
              invited_token: true,
            },
          })
        : invitedUser;

      return {
        invitationId: persistedInvitation.id,
        userEmail: persistedInvitation.user_email,
        messageId: delivery.id,
      };
    })
  );

  const sent = results
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        invitationId: number;
        userEmail: string;
        messageId: string | null;
      }> => result.status === 'fulfilled'
    )
    .map(result => result.value);

  const failed = results
    .filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )
    .map(result => getErrorMessage(result.reason));

  return {
    requestId: request.id,
    sentCount: sent.length,
    failedCount: failed.length,
    sent,
    failed,
  };
}

export async function getInvitationByToken(
  token: string
): Promise<InvitationLookupResult | null> {
  const invitation = await prisma.invitedUser.findUnique({
    where: { invited_token: token },
    select: {
      id: true,
      request_id: true,
      invited_status: true,
      user_name: true,
      user_email: true,
      expired_at: true,
      respond_at: true,
      request: {
        select: {
          objective_category: true,
        },
      },
    },
  });

  if (!invitation) return null;

  const isExpired =
    invitation.expired_at !== null &&
    invitation.expired_at.getTime() < Date.now();

  return {
    id: invitation.id,
    requestId: invitation.request_id,
    requestCategory: invitation.request.objective_category,
    invitedStatus: invitation.invited_status,
    userName: invitation.user_name,
    userEmail: invitation.user_email,
    expiredAt: invitation.expired_at,
    respondAt: invitation.respond_at,
    isExpired,
  };
}

export async function respondToInvitation(
  token: string,
  action: InvitationResponseAction
): Promise<InvitationResponseResult> {
  const invitation = await prisma.invitedUser.findUnique({
    where: { invited_token: token },
    select: {
      id: true,
      invited_status: true,
      user_email: true,
      expired_at: true,
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found.');
  }

  const now = new Date();
  if (
    invitation.expired_at &&
    invitation.expired_at.getTime() < now.getTime()
  ) {
    return { type: 'expired' };
  }

  const nextStatus =
    action === 'accept' ? InviteStatus.accepted : InviteStatus.rejected;

  if (invitation.invited_status === InviteStatus.pending) {
    await prisma.invitedUser.update({
      where: { id: invitation.id },
      data: {
        invited_status: nextStatus,
        respond_at: now,
      },
    });

    if (nextStatus === InviteStatus.rejected) {
      return { type: 'rejected' };
    }

    return buildAcceptedInvitationResponse(invitation.user_email);
  }

  if (invitation.invited_status === InviteStatus.rejected) {
    return { type: 'rejected' };
  }

  return buildAcceptedInvitationResponse(invitation.user_email);
}

export async function getOwnedRequestInvitationData(params: {
  clerkUserId: string;
  requestId: number;
}) {
  const request = await prisma.request.findFirst({
    where: {
      id: params.requestId,
      user: { clerk_id: params.clerkUserId },
    },
    select: {
      id: true,
      objective_category: true,
      expired_at: true,
      invited_users: {
        orderBy: [{ created_at: 'desc' }],
        select: {
          id: true,
          user_name: true,
          user_email: true,
          invited_status: true,
          respond_at: true,
        },
      },
    },
  });

  if (!request) return null;

  return {
    id: request.id,
    objectiveCategory: request.objective_category,
    expiredAt: request.expired_at,
    invitedUsers: request.invited_users.map(user => ({
      id: user.id,
      userName: user.user_name,
      userEmail: user.user_email,
      invitedStatus: user.invited_status,
      respondAt: user.respond_at,
    })),
  };
}
