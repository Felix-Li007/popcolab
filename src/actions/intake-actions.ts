'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/libs/prisma-client';

export type IntakeFormState = {
  errors?: {
    firstName?: string;
    lastName?: string;
    userName?: string;
    jobRole?: string;
  };
};

export async function submitIntakeFormAction(
  _prev: IntakeFormState,
  formData: FormData
): Promise<IntakeFormState> {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const firstName = (formData.get('firstName') as string)?.trim() ?? '';
  const lastName = (formData.get('lastName') as string)?.trim() ?? '';
  const rawUserName = (formData.get('userName') as string)?.trim() ?? '';
  const userName = rawUserName.startsWith('@')
    ? rawUserName.slice(1).trim()
    : rawUserName;
  const jobRole = (formData.get('jobRole') as string)?.trim() ?? '';
  const department = (formData.get('department') as string)?.trim() ?? '';
  const pronouns = (formData.get('pronouns') as string)?.trim() ?? '';

  const errors: IntakeFormState['errors'] = {};
  if (!firstName) errors.firstName = 'First name is required.';
  if (!lastName) errors.lastName = 'Last name is required.';
  if (!userName) errors.userName = 'Username is required.';
  if (!jobRole) errors.jobRole = 'Job role is required.';
  if (Object.keys(errors).length > 0) return { errors };

  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { id: true },
  });
  if (!user) redirect('/sign-in');

  await prisma.user.update({
    where: { id: user.id },
    data: { user_name: userName, intake_complete: true },
  });

  const existingProfile = await prisma.profile.findUnique({
    where: { user_id: user.id },
    select: { id: true },
  });

  if (existingProfile) {
    await prisma.profile.update({
      where: { user_id: user.id },
      data: {
        first_name: firstName,
        last_name: lastName,
        pronouns: pronouns || null,
      },
    });
  } else {
    await prisma.profile.create({
      data: {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        pronouns: pronouns || null,
        consent_given: 1,
      },
    });
  }

  const existingCompany = await prisma.company.findUnique({
    where: { user_id: user.id },
    select: { id: true },
  });

  if (existingCompany) {
    await prisma.company.update({
      where: { user_id: user.id },
      data: {
        role_title: jobRole,
        department_name: department || null,
      },
    });
  } else {
    await prisma.company.create({
      data: {
        user_id: user.id,
        role_title: jobRole,
        department_name: department || null,
      },
    });
  }

  redirect('/test');
}
