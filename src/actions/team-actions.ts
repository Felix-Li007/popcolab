'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/libs/prisma-client';
import {
  createTeamWithInvites,
  deleteTeam,
  respondToTeamInvite,
  updateTeam,
  removeTeamMember,
  addInviteesToTeam,
} from '@/services/user-team-service';

const TEAMS_PATH = '/dashboard/teams';

async function getAuthUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Not authenticated.');

  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { id: true, email: true, user_name: true },
  });
  if (!user) throw new Error('User not found.');
  return user;
}

export type CreateTeamState = {
  error?: string;
  fieldErrors?: { name?: string };
};

export async function createTeamAction(
  _prev: CreateTeamState,
  formData: FormData
): Promise<CreateTeamState> {
  const user = await getAuthUser();

  const name = (formData.get('name') as string)?.trim() ?? '';
  const department = (formData.get('department') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;

  const rawInvitees = formData.get('invitees') as string;
  const invitees: { value: string }[] = rawInvitees
    ? JSON.parse(rawInvitees)
    : [];

  if (!name) return { fieldErrors: { name: 'Team name is required.' } };

  await createTeamWithInvites({
    userId: user.id,
    name,
    department,
    description,
    invitees,
  });

  revalidatePath(TEAMS_PATH);
  return {};
}

export async function deleteTeamAction(teamId: number): Promise<void> {
  const user = await getAuthUser();
  await deleteTeam(teamId, user.id);
  revalidatePath(TEAMS_PATH);
}

export async function respondToTeamInviteAction(
  inviteId: number,
  action: 'accept' | 'reject'
): Promise<void> {
  const user = await getAuthUser();
  await respondToTeamInvite(inviteId, user.id, user.email, action);
  revalidatePath(TEAMS_PATH);
}

export type UpdateTeamState = {
  error?: string;
  fieldErrors?: { name?: string };
};

export async function updateTeamAction(
  _prev: UpdateTeamState,
  formData: FormData
): Promise<UpdateTeamState> {
  const user = await getAuthUser();

  const teamId = Number(formData.get('teamId'));
  const name = (formData.get('name') as string)?.trim() ?? '';
  const department = (formData.get('department') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;

  if (!name) return { fieldErrors: { name: 'Team name is required.' } };

  await updateTeam(teamId, user.id, { name, department, description });
  revalidatePath(TEAMS_PATH);
  return {};
}

export async function removeTeamMemberAction(
  teamMateId: number
): Promise<void> {
  const user = await getAuthUser();
  await removeTeamMember(teamMateId, user.id);
  revalidatePath(TEAMS_PATH);
}

export type InviteToTeamState = {
  error?: string;
};

export async function addInviteesToTeamAction(
  _prev: InviteToTeamState,
  formData: FormData
): Promise<InviteToTeamState> {
  const user = await getAuthUser();

  const teamId = Number(formData.get('teamId'));
  const teamName = (formData.get('teamName') as string)?.trim() ?? '';
  const rawInvitees = formData.get('invitees') as string;
  const invitees: { value: string }[] = rawInvitees
    ? JSON.parse(rawInvitees)
    : [];

  if (invitees.length === 0) return { error: 'Add at least one person.' };

  await addInviteesToTeam({
    teamId,
    inviterId: user.id,
    teamName,
    invitees,
  });

  revalidatePath(TEAMS_PATH);
  return {};
}
