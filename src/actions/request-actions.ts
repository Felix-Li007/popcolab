'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { createRequest } from '@/services/request-service';
import { sendRequestInvitations } from '@/services/invitation-service';

const REQUESTS_PATH = '/dashboard/requests';
const PROPOSALS_PATH = '/dashboard/proposals';

async function getAuthUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Not authenticated.');

  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { id: true },
  });
  if (!user) throw new Error('User not found.');
  return user;
}

export type CreateRequestState = {
  error?: string;
  fieldErrors?: {
    eventTypes?: string;
    objectives?: string;
    budget?: string;
    startDate?: string;
    groupSize?: string;
    eventDate?: string;
  };
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseList(raw: string): string[] {
  return raw
    ? raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];
}

function buildPreferredDate(date: string, time: string | null): Date {
  return time ? new Date(`${date}T${time}`) : new Date(date);
}

function parsePreferredDateSlots(
  raw: string | null
): Array<{ date: string; startTime: string; endTime: string }> {
  if (!raw) return [];

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(item => {
      if (!item || typeof item !== 'object') return null;

      const date = String((item as { date?: unknown }).date ?? '').trim();
      const startTime = String(
        (item as { startTime?: unknown }).startTime ?? ''
      ).trim();
      const endTime = String(
        (item as { endTime?: unknown }).endTime ?? ''
      ).trim();

      if (!date && !startTime && !endTime) {
        return null;
      }

      return { date, startTime, endTime };
    })
    .filter(
      (
        item
      ): item is {
        date: string;
        startTime: string;
        endTime: string;
      } => item !== null
    )
    .slice(0, 3);
}

function parseCurrencyNumber(raw: string | null): number | null {
  if (!raw) return null;
  const normalized = raw.replaceAll(/[$,]/g, '').trim();
  if (!normalized) return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function buildNotes(parts: (string | null)[]): string | null {
  const joined = parts.filter(Boolean).join('\n');
  return joined || null;
}

function parseMemberAnswers(
  raw: string | null
): Array<{ questionId: number; value: string | string[] }> {
  if (!raw) return [];

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const items: Array<{
    questionId: number;
    value: string | string[];
  } | null> = Object.entries(parsed).map(([key, value]) => {
    const questionId = Number(key);
    if (!Number.isInteger(questionId) || questionId < 1) {
      return null;
    }

    if (Array.isArray(value)) {
      const values = value.map(item => String(item).trim()).filter(Boolean);
      return values.length > 0 ? { questionId, value: values } : null;
    }

    if (typeof value === 'string') {
      const normalized = value.trim();
      if (!normalized) return null;

      const values = normalized
        .split('|')
        .map(item => item.trim())
        .filter(Boolean);

      return values.length > 1
        ? { questionId, value: values }
        : { questionId, value: normalized };
    }

    return value === null || value === undefined
      ? null
      : { questionId, value: String(value) };
  });

  return items.filter(
    (
      item
    ): item is {
      questionId: number;
      value: string | string[];
    } => item !== null
  );
}

async function resolveInviteEmails(
  inviteValues: string[]
): Promise<{ userName: string; userEmail: string }[]> {
  // Invite selections may include direct email chips and whole-team entries.
  // Normalize both sources into a single recipient list before deduping.
  const result: { userName: string; userEmail: string }[] = [];

  for (const v of inviteValues) {
    if (v.startsWith('email:')) {
      const email = v.slice(6).trim();
      if (email) {
        const name = email.split('@')[0] ?? email;
        result.push({ userName: name, userEmail: email });
      }
    } else if (v.startsWith('team:')) {
      const teamId = Number(v.slice(5));
      if (!Number.isNaN(teamId)) {
        const members = await prisma.teamMate.findMany({
          where: { team_id: teamId },
          select: {
            user: {
              select: {
                email: true,
                profile: { select: { first_name: true, last_name: true } },
              },
            },
          },
        });
        for (const m of members) {
          const name =
            [m.user.profile?.first_name, m.user.profile?.last_name]
              .filter(Boolean)
              .join(' ')
              .trim() || m.user.email.split('@')[0];
          result.push({ userName: name, userEmail: m.user.email });
        }
      }
    }
  }

  // Deduplicate by email
  const seen = new Set<string>();
  return result.filter(r => {
    if (seen.has(r.userEmail)) return false;
    seen.add(r.userEmail);
    return true;
  });
}

function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

// ── Action ───────────────────────────────────────────────────────────────────

export async function createRequestAction(
  _prev: CreateRequestState,
  formData: FormData
): Promise<CreateRequestState> {
  const user = await getAuthUser();

  const eventTypes = parseList((formData.get('eventTypes') as string) ?? '');
  const objectives = parseList((formData.get('objectives') as string) ?? '');
  const inviteRaw = parseList((formData.get('invites') as string) ?? '');
  const anythingElse = (formData.get('anythingElse') as string)?.trim() || null;
  const budgetMinRaw = (formData.get('budgetMin') as string)?.trim() || null;
  const budgetMaxRaw = (formData.get('budgetMax') as string)?.trim() || null;
  const preferredDateSlotsRaw =
    (formData.get('preferredDateSlots') as string)?.trim() || null;
  const durationRaw = (formData.get('duration') as string)?.trim() || null;
  const location = (formData.get('location') as string)?.trim() || null;
  const groupSizeRaw = (formData.get('groupSize') as string)?.trim() || null;
  const eventDateRaw = (formData.get('eventDate') as string)?.trim() || null;
  const proposalTimeRaw =
    (formData.get('proposalTime') as string)?.trim() || null;
  const memberAnswersRaw =
    (formData.get('memberAnswers') as string)?.trim() || null;

  // Validate the full multi-step payload before writing anything so the user
  // gets field-level feedback instead of a partial request being created.
  const fieldErrors: CreateRequestState['fieldErrors'] = {};

  if (eventTypes.length === 0)
    fieldErrors.eventTypes = 'Please select at least one event type.';
  if (objectives.length === 0)
    fieldErrors.objectives = 'Please select at least one objective.';
  const budgetMin = parseCurrencyNumber(budgetMinRaw);
  const budgetMax = parseCurrencyNumber(budgetMaxRaw);

  if (budgetMin === null || budgetMax === null) {
    fieldErrors.budget = 'Please provide both minimum and maximum budget.';
  } else if (budgetMax < budgetMin) {
    fieldErrors.budget =
      'Maximum budget must be greater than or equal to minimum budget.';
  }
  let preferredDateSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  try {
    preferredDateSlots = parsePreferredDateSlots(preferredDateSlotsRaw);
  } catch {
    return {
      error: 'We could not read the preferred event times. Please try again.',
    };
  }

  if (preferredDateSlots.length === 0) {
    fieldErrors.startDate =
      'Please add at least one preferred date and time slot.';
  } else if (
    preferredDateSlots.some(
      slot => !slot.date || !slot.startTime || !slot.endTime
    )
  ) {
    fieldErrors.startDate =
      'Please complete the date, start time, and end time for each preferred slot.';
  } else if (
    preferredDateSlots.some(
      slot =>
        buildPreferredDate(slot.date, slot.endTime) <
        buildPreferredDate(slot.date, slot.startTime)
    )
  ) {
    fieldErrors.startDate =
      'Each preferred slot must end after its start time.';
  }
  if (!groupSizeRaw || Number(groupSizeRaw) < 1)
    fieldErrors.groupSize = 'Please enter the group size.';
  if (!eventDateRaw)
    fieldErrors.eventDate = 'Please select a proposal deadline date.';

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const deadlineDate = buildPreferredDate(eventDateRaw!, proposalTimeRaw);
  const durationMax = durationRaw ? Math.round(Number(durationRaw)) : null;
  const groupSize = Number(groupSizeRaw);
  const preferredDates = preferredDateSlots.map(slot => ({
    date: new Date(slot.date),
    startTime: buildPreferredDate(slot.date, slot.startTime),
    endTime: buildPreferredDate(slot.date, slot.endTime),
  }));

  const objectivesNote =
    objectives.length > 0 ? `Objectives: ${objectives.join(', ')}` : null;
  const locationNote = location ? `Location: ${location}` : null;
  const deadlineNote = eventDateRaw
    ? `Proposal deadline: ${eventDateRaw}${proposalTimeRaw ? ` at ${proposalTimeRaw}` : ''}`
    : null;

  const notesForAdmin = buildNotes([
    objectivesNote,
    locationNote,
    deadlineNote,
    anythingElse,
  ]);

  let requestPreferences: Array<{
    questionId: number;
    value: string | string[];
  }>;
  try {
    requestPreferences = parseMemberAnswers(memberAnswersRaw);
  } catch {
    return {
      error: 'We could not read the team question answers. Please try again.',
    };
  }

  const requestId = await createRequest({
    userId: user.id,
    eventTypes,
    durationMax,
    budgetMin,
    budgetMax,
    preferredDates,
    deadlineDate,
    participantCount: groupSize,
    notesForAdmin,
    requestPreferences,
  });

  if (inviteRaw.length > 0) {
    const invitations = await resolveInviteEmails(inviteRaw);
    if (invitations.length > 0) {
      try {
        await sendRequestInvitations({
          clerkUserId: (await auth()).userId!,
          requestId,
          invitations,
          appBaseUrl: getAppBaseUrl(),
        });
      } catch {
        // Invites failing should not block the request from being created
      }
    }
  }

  revalidatePath(REQUESTS_PATH);
  redirect(REQUESTS_PATH);
}

// ── Request actions ───────────────────────────────────────────────────────────

export async function cancelRequestAction(requestId: number): Promise<void> {
  const user = await getAuthUser();

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { user_id: true, request_status: true },
  });

  if (!request || request.user_id !== user.id) {
    throw new Error('Not authorised.');
  }

  if (request.request_status !== 'OPENED') {
    throw new Error(
      'Only submitted requests that have not yet been reviewed can be cancelled.'
    );
  }

  await prisma.request.update({
    where: { id: requestId },
    data: { request_status: 'CLOSED' },
  });

  try {
    const { enqueueRequestChangedNotification } =
      await import('@/services/notification-service');
    await enqueueRequestChangedNotification({
      requestId,
      previousStatus: REQUEST_STATUS.OPENED,
      nextStatus: REQUEST_STATUS.CLOSED,
    });
  } catch {
    // Cancellation should still succeed even if notification queueing fails.
  }

  revalidatePath(REQUESTS_PATH);
}

// ── Proposal actions ─────────────────────────────────────────────────────────

export async function acceptProposalAction(proposalId: number): Promise<void> {
  const user = await getAuthUser();

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: {
      request: {
        select: {
          user_id: true,
          id: true,
          request_status: true,
        },
      },
    },
  });

  if (proposal?.request.user_id !== user.id) {
    throw new Error('Not authorised.');
  }

  await prisma.$transaction(async tx => {
    await tx.proposal.update({
      where: { id: proposalId },
      data: { proposal_status: ProposalStatus.ACCEPTED },
    });

    await tx.request.update({
      where: { id: proposal.request.id },
      data: { request_status: REQUEST_STATUS.CLOSED },
    });
  });

  try {
    const { enqueueRequestChangedNotification } =
      await import('@/services/notification-service');
    await enqueueRequestChangedNotification({
      requestId: proposal.request.id,
      previousStatus: String(proposal.request.request_status).toUpperCase(),
      nextStatus: REQUEST_STATUS.CLOSED,
    });
  } catch {
    // Acceptance should still succeed even if notification queueing fails.
  }

  revalidatePath(REQUESTS_PATH);
  revalidatePath(PROPOSALS_PATH);
}

export type RejectProposalState = {
  error?: string;
  fieldErrors?: { reason?: string };
};

export async function rejectProposalAction(
  _prev: RejectProposalState,
  formData: FormData
): Promise<RejectProposalState> {
  const user = await getAuthUser();

  const proposalId = Number(formData.get('proposalId'));
  const reason = (formData.get('reason') as string)?.trim() ?? '';
  const feedback = (formData.get('feedback') as string)?.trim() ?? '';

  if (!reason) return { fieldErrors: { reason: 'Please select a reason.' } };

  const rejectNotes = [reason, feedback].filter(Boolean).join('\n\n');

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: {
      request: {
        select: {
          id: true,
          user_id: true,
          request_status: true,
        },
      },
    },
  });

  if (proposal?.request.user_id !== user.id) {
    throw new Error('Not authorised.');
  }

  await prisma.$transaction(async tx => {
    await tx.proposal.update({
      where: { id: proposalId },
      data: {
        proposal_status: ProposalStatus.REJECTED,
        reject_notes: rejectNotes || null,
      },
    });

    await tx.request.update({
      where: { id: proposal.request.id },
      data: { request_status: REQUEST_STATUS.PENDING },
    });
  });

  try {
    const { enqueueRequestChangedNotification } =
      await import('@/services/notification-service');
    await enqueueRequestChangedNotification({
      requestId: proposal.request.id,
      previousStatus: String(proposal.request.request_status).toUpperCase(),
      nextStatus: REQUEST_STATUS.PENDING,
    });
  } catch {
    // Rejection should still succeed even if notification queueing fails.
  }

  revalidatePath(REQUESTS_PATH);
  revalidatePath(PROPOSALS_PATH);
  return {};
}
