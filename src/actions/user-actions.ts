'use server';

import { revalidatePath } from 'next/cache';
import {
  normalizeUserEditableUpdateInput,
  updateUserEditableFields,
  validateUserEditableUpdateInput,
} from '@/services/user-service';
import type {
  AdminUserEditableUpdateErrors,
  AdminUserEditableUpdateInput,
} from '@/types/user-type';

const ADMIN_PATHS = ['/admin', '/admin/users'];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
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
