jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    request: {
      findFirst: jest.fn(),
    },
    invitedUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/services/resend-service', () => ({
  sendResendEmail: jest.fn(),
}));

jest.mock('@/libs/prisma/client', () => ({
  InviteStatus: {
    pending: 'pending',
    accepted: 'accepted',
    rejected: 'rejected',
  },
}));

import { prisma } from '@/libs/prisma-client';
import { InviteStatus } from '@/libs/prisma/client';
import { sendResendEmail } from '@/services/resend-service';
import {
  getInvitationByToken,
  respondToInvitation,
  sendRequestInvitations,
} from '@/services/invitation-service';

type PrismaMock = {
  request: {
    findFirst: jest.Mock;
  };
  invitedUser: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
};

const prismaMock = prisma as unknown as PrismaMock;
const sendResendEmailMock = sendResendEmail as jest.MockedFunction<
  typeof sendResendEmail
>;

describe('invitation-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
    process.env.RESEND_FROM_EMAIL = 'noreply@popcolab.dev';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('sendRequestInvitations normalizes recipients, creates new invitations and sends emails', async () => {
    prismaMock.request.findFirst.mockResolvedValue({
      id: 15,
      objective_category: 'team_building',
      expired_at: new Date('2026-03-20T12:00:00.000Z'),
    });
    prismaMock.invitedUser.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.invitedUser.create
      .mockResolvedValueOnce({
        id: 101,
        user_email: 'jane@example.com',
        invited_token: 'token-1',
      })
      .mockResolvedValueOnce({
        id: 102,
        user_email: 'john@example.com',
        invited_token: 'token-2',
      });
    sendResendEmailMock.mockResolvedValue({ id: 'email-1' });

    const result = await sendRequestInvitations({
      clerkUserId: 'clerk_123',
      requestId: 15,
      appBaseUrl: 'https://popcolab.test',
      invitations: [
        { userName: 'Jane Doe', userEmail: ' Jane@example.com ' },
        { userName: 'Jane Duplicate', userEmail: 'jane@example.com' },
        { userName: '', userEmail: 'john@example.com' },
        { userName: 'Bad', userEmail: 'not-an-email' },
      ],
    });

    expect(prismaMock.request.findFirst).toHaveBeenCalledWith({
      where: {
        id: 15,
        user: { clerk_id: 'clerk_123' },
      },
      select: {
        id: true,
        objective_category: true,
        expired_at: true,
      },
    });
    expect(prismaMock.invitedUser.findUnique).toHaveBeenCalledTimes(2);
    expect(prismaMock.invitedUser.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.invitedUser.update).not.toHaveBeenCalled();
    expect(sendResendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendResendEmailMock).toHaveBeenNthCalledWith(1, {
      to: 'jane@example.com',
      from: expect.any(String),
      subject: "You're invited to join a team_building request",
      react: expect.any(Object),
    });
    expect(result.sentCount).toBe(2);
    expect(result.failedCount).toBe(0);
  });

  test('sendRequestInvitations reuses an existing token and only resets the invitation after a successful resend', async () => {
    prismaMock.request.findFirst.mockResolvedValue({
      id: 15,
      objective_category: 'team_building',
      expired_at: new Date('2026-03-20T12:00:00.000Z'),
    });
    prismaMock.invitedUser.findUnique.mockResolvedValue({
      id: 101,
      user_email: 'jane@example.com',
      invited_token: 'existing-token',
    });
    prismaMock.invitedUser.update.mockResolvedValue({
      id: 101,
      user_email: 'jane@example.com',
      invited_token: 'existing-token',
    });
    sendResendEmailMock.mockResolvedValue({ id: 'email-1' });

    const result = await sendRequestInvitations({
      clerkUserId: 'clerk_123',
      requestId: 15,
      appBaseUrl: 'https://popcolab.test',
      invitations: [{ userName: 'Jane Doe', userEmail: 'jane@example.com' }],
    });

    expect(prismaMock.invitedUser.create).not.toHaveBeenCalled();
    expect(prismaMock.invitedUser.update).toHaveBeenCalledWith({
      where: { id: 101 },
      data: {
        user_name: 'Jane Doe',
        invited_status: InviteStatus.pending,
        expired_at: new Date('2026-03-20T12:00:00.000Z'),
        respond_at: null,
      },
      select: {
        id: true,
        user_email: true,
        invited_token: true,
      },
    });
    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
  });

  test('sendRequestInvitations preserves an existing invitation when the resend email fails', async () => {
    prismaMock.request.findFirst.mockResolvedValue({
      id: 15,
      objective_category: 'team_building',
      expired_at: new Date('2026-03-20T12:00:00.000Z'),
    });
    prismaMock.invitedUser.findUnique.mockResolvedValue({
      id: 101,
      user_email: 'jane@example.com',
      invited_token: 'existing-token',
    });
    sendResendEmailMock.mockRejectedValue(new Error('Resend is down'));

    const result = await sendRequestInvitations({
      clerkUserId: 'clerk_123',
      requestId: 15,
      appBaseUrl: 'https://popcolab.test',
      invitations: [{ userName: 'Jane Doe', userEmail: 'jane@example.com' }],
    });

    expect(prismaMock.invitedUser.create).not.toHaveBeenCalled();
    expect(prismaMock.invitedUser.update).not.toHaveBeenCalled();
    expect(prismaMock.invitedUser.delete).not.toHaveBeenCalled();
    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.failed).toEqual(['Resend is down']);
  });

  test('sendRequestInvitations deletes a newly created invitation when the initial email send fails', async () => {
    prismaMock.request.findFirst.mockResolvedValue({
      id: 15,
      objective_category: 'team_building',
      expired_at: new Date('2026-03-20T12:00:00.000Z'),
    });
    prismaMock.invitedUser.findUnique.mockResolvedValue(null);
    prismaMock.invitedUser.create.mockResolvedValue({
      id: 101,
      user_email: 'jane@example.com',
      invited_token: 'new-token',
    });
    prismaMock.invitedUser.delete.mockResolvedValue({ id: 101 });
    sendResendEmailMock.mockRejectedValue(new Error('Resend is down'));

    const result = await sendRequestInvitations({
      clerkUserId: 'clerk_123',
      requestId: 15,
      appBaseUrl: 'https://popcolab.test',
      invitations: [{ userName: 'Jane Doe', userEmail: 'jane@example.com' }],
    });

    expect(prismaMock.invitedUser.delete).toHaveBeenCalledWith({
      where: { id: 101 },
    });
    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.failed).toEqual(['Resend is down']);
  });

  test('getInvitationByToken maps the invitation payload', async () => {
    prismaMock.invitedUser.findUnique.mockResolvedValue({
      id: 9,
      request_id: 3,
      invited_status: InviteStatus.pending,
      user_name: 'Jane Doe',
      user_email: 'jane@example.com',
      expired_at: new Date('2026-03-20T12:00:00.000Z'),
      respond_at: null,
      request: {
        objective_category: 'wellness',
      },
    });

    await expect(getInvitationByToken('token-123')).resolves.toEqual({
      id: 9,
      requestId: 3,
      requestCategory: 'wellness',
      invitedStatus: InviteStatus.pending,
      userName: 'Jane Doe',
      userEmail: 'jane@example.com',
      expiredAt: new Date('2026-03-20T12:00:00.000Z'),
      respondAt: null,
      isExpired: false,
    });
  });

  test('respondToInvitation redirects accepted invitations to sign-in when the account exists', async () => {
    prismaMock.invitedUser.findUnique.mockResolvedValue({
      id: 88,
      invited_status: InviteStatus.pending,
      user_email: 'member@example.com',
      expired_at: null,
    });
    prismaMock.invitedUser.update.mockResolvedValue({ id: 88 });
    prismaMock.user.findUnique.mockResolvedValue({ id: 7 });

    await expect(respondToInvitation('token-abc', 'accept')).resolves.toEqual({
      type: 'accepted',
      userEmail: 'member@example.com',
      authAction: 'sign-in',
    });

    expect(prismaMock.invitedUser.update).toHaveBeenCalledWith({
      where: { id: 88 },
      data: {
        invited_status: InviteStatus.accepted,
        respond_at: new Date('2026-03-11T12:00:00.000Z'),
      },
    });
  });

  test('respondToInvitation redirects accepted invitations to sign-up when no account exists', async () => {
    prismaMock.invitedUser.findUnique.mockResolvedValue({
      id: 89,
      invited_status: InviteStatus.pending,
      user_email: 'new-user@example.com',
      expired_at: null,
    });
    prismaMock.invitedUser.update.mockResolvedValue({ id: 89 });
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(respondToInvitation('token-new', 'accept')).resolves.toEqual({
      type: 'accepted',
      userEmail: 'new-user@example.com',
      authAction: 'sign-up',
    });
  });

  test('respondToInvitation redirects rejected and expired invitations to the public invitation page', async () => {
    prismaMock.invitedUser.findUnique
      .mockResolvedValueOnce({
        id: 90,
        invited_status: InviteStatus.pending,
        user_email: 'reject@example.com',
        expired_at: null,
      })
      .mockResolvedValueOnce({
        id: 91,
        invited_status: InviteStatus.pending,
        user_email: 'expired@example.com',
        expired_at: new Date('2026-03-10T12:00:00.000Z'),
      });
    prismaMock.invitedUser.update.mockResolvedValue({ id: 90 });

    await expect(
      respondToInvitation('token-reject', 'reject')
    ).resolves.toEqual({
      type: 'rejected',
    });
    await expect(
      respondToInvitation('token-expired', 'accept')
    ).resolves.toEqual({
      type: 'expired',
    });
  });

  test('respondToInvitation keeps a previously rejected invitation rejected for crafted accept requests', async () => {
    prismaMock.invitedUser.findUnique.mockResolvedValue({
      id: 92,
      invited_status: InviteStatus.rejected,
      user_email: 'reject@example.com',
      expired_at: null,
    });

    await expect(
      respondToInvitation('token-already-rejected', 'accept')
    ).resolves.toEqual({
      type: 'rejected',
    });

    expect(prismaMock.invitedUser.update).not.toHaveBeenCalled();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  test('respondToInvitation keeps a previously accepted invitation accepted for crafted reject requests', async () => {
    prismaMock.invitedUser.findUnique.mockResolvedValue({
      id: 93,
      invited_status: InviteStatus.accepted,
      user_email: 'accepted@example.com',
      expired_at: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: 8 });

    await expect(
      respondToInvitation('token-already-accepted', 'reject')
    ).resolves.toEqual({
      type: 'accepted',
      userEmail: 'accepted@example.com',
      authAction: 'sign-in',
    });

    expect(prismaMock.invitedUser.update).not.toHaveBeenCalled();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'accepted@example.com' },
      select: { id: true },
    });
  });
});
