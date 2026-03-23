'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/libs/prisma-client';
import { createRequest } from '@/services/user-request-service';

const REQUESTS_PATH = '/dashboard/requests';

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
    objectiveCategory?: string;
    preferredDate?: string;
    participantCount?: string;
  };
};

export async function createRequestAction(
  _prev: CreateRequestState,
  formData: FormData
): Promise<CreateRequestState> {
  const user = await getAuthUser();

  const objectiveCategory =
    (formData.get('objectiveCategory') as string)?.trim() ?? '';
  const preferredDateRaw = (formData.get('preferredDate') as string)?.trim();
  const participantCountRaw = formData.get('participantCount') as string;
  const budgetRaw = (formData.get('budget') as string)?.trim() || null;
  const notesForAdmin =
    (formData.get('notesForAdmin') as string)?.trim() || null;
  const fieldErrors: CreateRequestState['fieldErrors'] = {};
  if (!objectiveCategory)
    fieldErrors.objectiveCategory = 'Please select a category.';
  if (!preferredDateRaw)
    fieldErrors.preferredDate = 'Preferred date is required.';
  if (!participantCountRaw || Number(participantCountRaw) < 1)
    fieldErrors.participantCount = 'Participant count is required.';

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const preferredDate = preferredDateRaw ? new Date(preferredDateRaw) : null;
  const participantCount = participantCountRaw
    ? Number(participantCountRaw)
    : null;

  let budgetMin: number | null = null;
  let budgetMax: number | null = null;
  if (budgetRaw) {
    const parts = budgetRaw.replace(/\$|,/g, '').split(/[-–]/);
    budgetMin = parts[0] ? Number(parts[0].trim()) : null;
    budgetMax = parts[1] ? Number(parts[1].trim()) : budgetMin;
  }

  await createRequest({
    userId: user.id,
    objectiveCategory,
    preferredDate,
    participantCount,
    budgetMin,
    budgetMax,
    notesForAdmin,
  });

  revalidatePath(REQUESTS_PATH);
  return {};
}

export async function acceptProposalAction(proposalId: number): Promise<void> {
  const user = await getAuthUser();

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { request: { select: { user_id: true, id: true } } },
  });

  if (!proposal || proposal.request.user_id !== user.id) {
    throw new Error('Not authorised.');
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { proposal_status: 'accepted' },
  });

  revalidatePath(REQUESTS_PATH);
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

  if (!proposal || proposal.request.user_id !== user.id) {
    throw new Error('Not authorised.');
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { proposal_status: 'rejected' },
  });

  revalidatePath(REQUESTS_PATH);
  return {};
}
