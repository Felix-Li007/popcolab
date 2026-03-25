'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { prisma } from '@/libs/prisma-client';
import { resolveRoleBranding } from '@/constants/role-branding';
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
import { getTrimmedFormString } from '@/utils/form-data';
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
  companyName: string;
  departmentName: string;
  roleTitle: string;
  workMode: WorkMode | '';
  companySize: string;
  companyWebsite: string;
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
const COMPANY_WEBSITE_MAX_LENGTH = 255;

type NormalizedCompanyUpdateInput = {
  companyName: string | null;
  departmentName: string | null;
  roleTitle: string | null;
  workMode: WorkMode | null;
  companySize: number | null;
  companyWebsite: string | null;
  rawCompanySize: string;
};

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

function normalizeCompanyUpdateInput(
  input: SignedInCompanyUpdateInput
): NormalizedCompanyUpdateInput {
  const rawCompanySize = input.companySize.trim();

  return {
    companyName: toNullableTrimmed(input.companyName),
    departmentName: toNullableTrimmed(input.departmentName),
    roleTitle: toNullableTrimmed(input.roleTitle),
    workMode: normalizeWorkMode(input.workMode),
    companySize:
      rawCompanySize.length === 0 ? null : Number.parseInt(rawCompanySize, 10),
    companyWebsite: toNullableTrimmed(input.companyWebsite),
    rawCompanySize,
  };
}

function validateCompanyUpdateInput(
  input: SignedInCompanyUpdateInput,
  normalized: NormalizedCompanyUpdateInput
): string | null {
  if (
    normalized.companyName &&
    normalized.companyName.length > COMPANY_NAME_MAX_LENGTH
  ) {
    return `Company name must be ${COMPANY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (
    normalized.departmentName &&
    normalized.departmentName.length > DEPARTMENT_MAX_LENGTH
  ) {
    return `Department name must be ${DEPARTMENT_MAX_LENGTH} characters or fewer.`;
  }

  if (
    normalized.roleTitle &&
    normalized.roleTitle.length > ROLE_TITLE_MAX_LENGTH
  ) {
    return `Role title must be ${ROLE_TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (input.workMode && !normalized.workMode) {
    return 'Work mode must be remote, hybrid, or onsite.';
  }

  if (
    normalized.rawCompanySize.length > 0 &&
    (normalized.companySize === null ||
      !Number.isInteger(normalized.companySize) ||
      normalized.companySize <= 0)
  ) {
    return 'Company size must be a positive integer.';
  }

  if (
    normalized.companyWebsite &&
    normalized.companyWebsite.length > COMPANY_WEBSITE_MAX_LENGTH
  ) {
    return `Company website must be ${COMPANY_WEBSITE_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}

async function ensureCompanyUser(params: {
  clerkId: string;
  email: string;
}): Promise<{ id: number }> {
  const userName = deriveUserNameFromEmail(params.email);
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ clerk_id: params.clerkId }, { email: params.email }],
    },
    select: { id: true },
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerk_id: params.clerkId,
        email: params.email,
        user_name: userName,
      },
      select: { id: true },
    });
  }

  return prisma.user.create({
    data: {
      clerk_id: params.clerkId,
      email: params.email,
      user_name: userName,
    },
    select: { id: true },
  });
}

function toCompanyInfo(company: {
  id: number;
  user_id: number;
  company_name: string | null;
  department_name: string | null;
  role_title: string | null;
  work_mode: string | null;
  company_size: number | null;
  company_website: string | null;
  created_at: Date;
  updated_at: Date;
}): CompanyInfo {
  return {
    id: company.id,
    userId: company.user_id,
    companyName: company.company_name,
    departmentName: company.department_name,
    roleTitle: company.role_title,
    workMode: normalizeWorkMode(company.work_mode),
    companySize: company.company_size,
    companyWebsite: company.company_website,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
  };
}

export async function getSignedInUserSummaryAction(): Promise<SignedInUserSummary | null> {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated || !authContext.user) {
    return null;
  }

  const firstName = authContext.user.firstName?.trim() ?? '';
  const lastName = authContext.user.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const company = await getCompanyAction();
  const branding = resolveRoleBranding(authContext.role, company);

  return {
    displayName: fullName || authContext.user.username || 'User',
    roleLabel: branding.displayLabel,
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
      id: true,
      user_id: true,
      company_name: true,
      department_name: true,
      role_title: true,
      work_mode: true,
      company_size: true,
      company_website: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!company) {
    return null;
  }

  return {
    id: company.id,
    userId: company.user_id,
    companyName: company.company_name,
    departmentName: company.department_name,
    roleTitle: company.role_title,
    workMode: normalizeWorkMode(company.work_mode),
    companySize: company.company_size,
    companyWebsite: company.company_website,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
  };
}

export async function deleteCompanyAction(): Promise<{
  success: boolean;
  error?: string;
}> {
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

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ clerk_id: authContext.user.id }, { email }],
      },
      select: { id: true },
    });

    if (!user) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/profile');

      return { success: true };
    }

    await prisma.company.deleteMany({
      where: {
        user_id: user.id,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Failed to delete company information. Please try again.',
    };
  }
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
  const normalized = normalizeCompanyUpdateInput(input);
  const validationError = validateCompanyUpdateInput(input, normalized);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  try {
    const user = await ensureCompanyUser({ clerkId, email });

    const company = await prisma.company.upsert({
      where: { user_id: user.id },
      update: {
        company_name: normalized.companyName,
        department_name: normalized.departmentName,
        role_title: normalized.roleTitle,
        work_mode: normalized.workMode,
        company_size: normalized.companySize,
        company_website: normalized.companyWebsite,
      },
      create: {
        user_id: user.id,
        company_name: normalized.companyName,
        department_name: normalized.departmentName,
        role_title: normalized.roleTitle,
        work_mode: normalized.workMode,
        company_size: normalized.companySize,
        company_website: normalized.companyWebsite,
      },
      select: {
        id: true,
        user_id: true,
        company_name: true,
        department_name: true,
        role_title: true,
        work_mode: true,
        company_size: true,
        company_website: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      success: true,
      data: toCompanyInfo(company),
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
  const companyName = getTrimmedFormString(formData, 'companyName');
  const departmentName = getTrimmedFormString(formData, 'departmentName');
  const roleTitle = getTrimmedFormString(formData, 'roleTitle');
  const rawWorkMode = getTrimmedFormString(formData, 'workMode').toLowerCase();
  const workMode: WorkMode | '' = isWorkMode(rawWorkMode) ? rawWorkMode : '';
  const companySize = getTrimmedFormString(formData, 'companySize');
  const companyWebsite = getTrimmedFormString(formData, 'companyWebsite');

  const result = await updateCompanyAction({
    companyName,
    departmentName,
    roleTitle,
    workMode,
    companySize,
    companyWebsite,
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
