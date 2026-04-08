'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { createRequest } from '@/services/user-request-service';
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

function parseBudget(raw: string): { min: number | null; max: number | null } {
  const parts = raw.replaceAll(/[$,]/g, '').split(/[-–]/);
  const min = Number(parts[0]?.trim() ?? '');
  const max = Number(parts[1]?.trim() ?? '');
  return {
    min: Number.isNaN(min) ? null : min,
    max: Number.isNaN(max) ? null : max,
  };
}

function buildNotes(parts: (string | null)[]): string | null {
  const joined = parts.filter(Boolean).join('\n');
  return joined || null;
}

async function resolveInviteEmails(
  inviteValues: string[]
): Promise<{ userName: string; userEmail: string }[]> {
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
  const budgetRaw = (formData.get('budget') as string)?.trim() || null;
  const startDateRaw = (formData.get('startDate') as string)?.trim() || null;
  const startTimeRaw = (formData.get('startTime') as string)?.trim() || null;
  const endTimeRaw = (formData.get('endTime') as string)?.trim() || null;
  const durationRaw = (formData.get('duration') as string)?.trim() || null;
  const location = (formData.get('location') as string)?.trim() || null;
  const groupSizeRaw = (formData.get('groupSize') as string)?.trim() || null;
  const eventDateRaw = (formData.get('eventDate') as string)?.trim() || null;
  const proposalTimeRaw =
    (formData.get('proposalTime') as string)?.trim() || null;

  const fieldErrors: CreateRequestState['fieldErrors'] = {};

  if (eventTypes.length === 0)
    fieldErrors.eventTypes = 'Please select at least one event type.';
  if (objectives.length === 0)
    fieldErrors.objectives = 'Please select at least one objective.';
  if (!budgetRaw)
    fieldErrors.budget = 'Please provide an estimated budget range.';
  if (!startDateRaw) fieldErrors.startDate = 'Please select a start date.';
  if (!groupSizeRaw || Number(groupSizeRaw) < 1)
    fieldErrors.groupSize = 'Please enter the group size.';
  if (!eventDateRaw)
    fieldErrors.eventDate = 'Please select a proposal deadline date.';

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const preferredDate = buildPreferredDate(startDateRaw!, startTimeRaw);
  const durationMax = durationRaw ? Math.round(Number(durationRaw)) : null;
  const groupSize = Number(groupSizeRaw);

  const { min: budgetMin, max: budgetMax } = budgetRaw
    ? parseBudget(budgetRaw)
    : { min: null, max: null };

  const objectivesNote =
    objectives.length > 0 ? `Objectives: ${objectives.join(', ')}` : null;
  const endNote = endTimeRaw
    ? `Event end: ${startDateRaw} at ${endTimeRaw}`
    : null;
  const locationNote = location ? `Location: ${location}` : null;
  const deadlineNote = eventDateRaw
    ? `Proposal deadline: ${eventDateRaw}${proposalTimeRaw ? ` at ${proposalTimeRaw}` : ''}`
    : null;

  const notesForAdmin = buildNotes([
    objectivesNote,
    locationNote,
    endNote,
    deadlineNote,
    anythingElse,
  ]);

  const requestId = await createRequest({
    userId: user.id,
    eventTypes,
    durationMax,
    budgetMin,
    budgetMax,
    preferredDate,
    participantCount: groupSize,
    notesForAdmin,
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
  return {};
}

// ── Proposal actions ─────────────────────────────────────────────────────────

export async function acceptProposalAction(proposalId: number): Promise<void> {
  const user = await getAuthUser();

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { request: { select: { user_id: true, id: true } } },
  });

  if (proposal?.request.user_id !== user.id) {
    throw new Error('Not authorised.');
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { proposal_status: ProposalStatus.ACCEPTED },
  });

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

  if (!reason) return { fieldErrors: { reason: 'Please select a reason.' } };

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { request: { select: { user_id: true } } },
  });

  if (proposal?.request.user_id !== user.id) {
    throw new Error('Not authorised.');
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { proposal_status: ProposalStatus.REJECTED },
  });

  revalidatePath(REQUESTS_PATH);
  revalidatePath(PROPOSALS_PATH);
  return {};
}
