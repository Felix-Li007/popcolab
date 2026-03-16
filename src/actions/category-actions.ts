'use server';

import { revalidatePath } from 'next/cache';
import type { ExperienceCategoryFormState } from '@/types/category-type';
import {
  createExperienceCategory,
  deleteExperienceCategory,
  updateExperienceCategory,
} from '@/services/category-service';
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
  const title = formData.get('title')?.toString().trim() ?? '';
  const notes = formData.get('notes')?.toString().trim() ?? '';
  const status = formData.get('status')?.toString().trim() ?? '';
  const parentRaw = formData.get('parentId')?.toString().trim() ?? '';
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
