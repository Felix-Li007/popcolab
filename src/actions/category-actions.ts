'use server';

import { revalidatePath } from 'next/cache';
import type { ExperienceCategoryFormState } from '@/types/category-type';
import {
  createExperienceCategory,
  deleteExperienceCategory,
  updateExperienceCategory,
} from '@/services/category-service';
import { getTrimmedFormString } from '@/utils/form-data';
import { validateExperienceCategoryFields } from '@/utils/experience-category-helper';

const ADMIN_PATHS = [
  '/admin',
  '/admin/experiences',
  '/admin/experiences/categories',
];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function parseCategoryForm(formData: FormData) {
  const title = getTrimmedFormString(formData, 'title');
  const notes = getTrimmedFormString(formData, 'notes');
  const status = getTrimmedFormString(formData, 'status');
  const parentRaw = getTrimmedFormString(formData, 'parentId');
  const parsedParentId = parentRaw ? Number.parseInt(parentRaw, 10) : null;

  return {
    title,
    notes,
    status,
    parentId: parsedParentId,
  };
}

export async function createExperienceCategoryAction(
  _prevState: ExperienceCategoryFormState,
  formData: FormData
): Promise<ExperienceCategoryFormState> {
  const parsed = parseCategoryForm(formData);
  const errors = validateExperienceCategoryFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createExperienceCategory({
      title: parsed.title,
      notes: parsed.notes || null,
      status: parsed.status,
      parentId: parsed.parentId,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (error) {
    return {
      errors: {
        _form:
          error instanceof Error
            ? error.message
            : 'Failed to create category. Please try again.',
      },
    };
  }
}

export async function updateExperienceCategoryAction(
  id: number,
  _prevState: ExperienceCategoryFormState,
  formData: FormData
): Promise<ExperienceCategoryFormState> {
  const parsed = parseCategoryForm(formData);
  const errors = validateExperienceCategoryFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updateExperienceCategory(id, {
      title: parsed.title,
      notes: parsed.notes || null,
      status: parsed.status,
      parentId: parsed.parentId,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (error) {
    return {
      errors: {
        _form:
          error instanceof Error
            ? error.message
            : 'Failed to update category. Please try again.',
      },
    };
  }
}

export async function deleteExperienceCategoryAction(
  id: number
): Promise<void> {
  await deleteExperienceCategory(id);
  revalidateAdminPaths();
}
