'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { prisma } from '@/libs/prisma-client';
import {
  isWorkMode,
  normalizeWorkMode,
  type WorkMode,
} from '@/constants/work-mode';
import {
  normalizeUserEditableUpdateInput,
  updateUserEditableFields,
  validateUserEditableUpdateInput,
} from '@/services/user-service';
import type { CompanyInfo } from '@/types/company-type';
import type {
  AdminUserEditableUpdateErrors,
  AdminUserEditableUpdateInput,
} from '@/types/user-type';

const ADMIN_PATHS = ['/admin', '/admin/users'];

export type SignedInUserSummary = {
  displayName: string;
  roleLabel: string;
};

export type SignedInCompany = CompanyInfo;

export type SignedInCompanyUpdateInput = {
  corporateName: string;
  departmentName: string;
  roleTitle: string;
  workMode: WorkMode | '';
};

export type SaveCompanyFormState = {
  success: boolean;
  message: string | null;
  error: string | null;
  values: CompanyInfo | null;
  version: number;
};

const COMPANY_NAME_MAX_LENGTH = 255;
const DEPARTMENT_MAX_LENGTH = 100;
const ROLE_TITLE_MAX_LENGTH = 50;
function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function readSignedInEmail(
  authUser: NonNullable<
    Awaited<ReturnType<typeof getCurrentAuthContext>>['user']
  >
): string | null {
  return (
    authUser.primaryEmailAddress?.emailAddress ??
    authUser.emailAddresses?.[0]?.emailAddress ??
    null
  );
}

function toNullableTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function deriveUserNameFromEmail(email: string): string {
  const localPart = email.split('@')[0]?.trim().toLowerCase() || 'user';
  return localPart.slice(0, 50) || 'user';
}

export async function getSignedInUserSummaryAction(): Promise<SignedInUserSummary | null> {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated || !authContext.user) {
    return null;
  }

  const firstName = authContext.user.firstName?.trim() ?? '';
  const lastName = authContext.user.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    displayName: fullName || authContext.user.username || 'User',
    roleLabel: authContext.role ?? 'User',
  };
}

export async function getCompanyAction(): Promise<SignedInCompany | null> {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated || !authContext.user) {
    return null;
  }

  const email = readSignedInEmail(authContext.user);
  if (!email) {
    return null;
  }

  const company = await prisma.company.findFirst({
    where: {
      user: {
        email,
      },
    },
    select: {
      corporate_name: true,
      department_name: true,
      role_title: true,
      work_mode: true,
    },
  });

  if (!company) {
    return null;
  }

  return {
    corporateName: company.corporate_name,
    departmentName: company.department_name,
    roleTitle: company.role_title,
    workMode: normalizeWorkMode(company.work_mode),
  };
}

export async function updateCompanyAction(
  input: SignedInCompanyUpdateInput
): Promise<{ success: boolean; error?: string; data?: CompanyInfo }> {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated || !authContext.user) {
    return {
      success: false,
      error: 'Authentication required.',
    };
  }

  const email = readSignedInEmail(authContext.user);
  if (!email) {
    return {
      success: false,
      error: 'No email found for current user.',
    };
  }
  const clerkId = authContext.user.id;

  const corporateName = toNullableTrimmed(input.corporateName);
  const departmentName = toNullableTrimmed(input.departmentName);
  const roleTitle = toNullableTrimmed(input.roleTitle);
  const workMode = normalizeWorkMode(input.workMode);

  if (corporateName && corporateName.length > COMPANY_NAME_MAX_LENGTH) {
    return {
      success: false,
      error: `Corporate name must be ${COMPANY_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (departmentName && departmentName.length > DEPARTMENT_MAX_LENGTH) {
    return {
      success: false,
      error: `Department name must be ${DEPARTMENT_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (roleTitle && roleTitle.length > ROLE_TITLE_MAX_LENGTH) {
    return {
      success: false,
      error: `Role title must be ${ROLE_TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (input.workMode && !workMode) {
    return {
      success: false,
      error: 'Work mode must be remote, hybrid, or onsite.',
    };
  }

  try {
    const userName = deriveUserNameFromEmail(email);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerk_id: clerkId }, { email }],
      },
      select: { id: true },
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            clerk_id: clerkId,
            email,
            user_name: userName,
          },
          select: { id: true },
        })
      : await prisma.user.create({
          data: {
            clerk_id: clerkId,
            email,
            user_name: userName,
          },
          select: { id: true },
        });

    await prisma.company.upsert({
      where: { user_id: user.id },
      update: {
        corporate_name: corporateName,
        department_name: departmentName,
        role_title: roleTitle,
        work_mode: workMode,
      },
      create: {
        user_id: user.id,
        corporate_name: corporateName,
        department_name: departmentName,
        role_title: roleTitle,
        work_mode: workMode,
      },
    });

    return {
      success: true,
      data: {
        corporateName,
        departmentName,
        roleTitle,
        workMode,
      },
    };
  } catch {
    return {
      success: false,
      error: 'Failed to save company information. Please try again.',
    };
  }
}

export async function saveCompanyAction(
  prevState: SaveCompanyFormState,
  formData: FormData
): Promise<SaveCompanyFormState> {
  const corporateName = String(formData.get('corporateName') ?? '');
  const departmentName = String(formData.get('departmentName') ?? '');
  const roleTitle = String(formData.get('roleTitle') ?? '');
  const rawWorkMode = String(formData.get('workMode') ?? '')
    .trim()
    .toLowerCase();
  const workMode: WorkMode | '' = isWorkMode(rawWorkMode) ? rawWorkMode : '';

  const result = await updateCompanyAction({
    corporateName,
    departmentName,
    roleTitle,
    workMode,
  });

  if (!result.success) {
    return {
      success: false,
      message: null,
      error: result.error ?? 'Failed to save company information.',
      values: prevState.values,
      version: prevState.version,
    };
  }

  return {
    success: true,
    message: 'Company information saved.',
    error: null,
    values: result.data ?? prevState.values,
    version: prevState.version + 1,
  };
}

export async function updateUserAction(
  userId: number,
  input: AdminUserEditableUpdateInput
): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: AdminUserEditableUpdateErrors;
}> {
  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      success: false,
      error: 'Invalid user id.',
    };
  }

  const normalized = normalizeUserEditableUpdateInput(input);
  const fieldErrors = validateUserEditableUpdateInput(normalized);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors,
    };
  }

  try {
    await updateUserEditableFields(userId, normalized);
    revalidateAdminPaths();
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Failed to update user. Please try again.',
    };
  }
}
