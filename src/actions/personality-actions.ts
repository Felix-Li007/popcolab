'use server';

import { revalidatePath } from 'next/cache';
import type { PersonalityFormState } from '@/types/personality-type';
import {
  validatePersonalityFields,
  createPersonality,
  updatePersonality,
  deletePersonality,
} from '@/services/personality-service';

const ADMIN_PATHS = ['/admin', '/admin/personalities'];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

export async function createPersonalityAction(
  _prevState: PersonalityFormState,
  formData: FormData
): Promise<PersonalityFormState> {
  const name = formData.get('name')?.toString().trim() ?? '';
  const type = formData.get('type')?.toString().trim().toUpperCase() ?? '';
  const description = formData.get('description')?.toString().trim() ?? '';
  const emoji = formData.get('emoji')?.toString() ?? '';
  const stars = parseInt(formData.get('stars')?.toString() ?? '3', 10);
  const status = formData.get('status')?.toString() ?? 'active';
  const accentColor = formData.get('accentColor')?.toString() ?? '';
  const threshold = parseFloat(formData.get('threshold')?.toString() ?? '0');

  const errors = validatePersonalityFields({
    name,
    type,
    description,
    threshold,
  });
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createPersonality({
      type,
      name,
      description,
      emoji,
      stars,
      status,
      accentColor,
      threshold,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('P2002')) {
      return { errors: { type: `Type "${type}" already exists` } };
    }
    return {
      errors: { _form: 'Failed to create personality. Please try again.' },
    };
  }
}

export async function updatePersonalityAction(
  id: number,
  _prevState: PersonalityFormState,
  formData: FormData
): Promise<PersonalityFormState> {
  const name = formData.get('name')?.toString().trim() ?? '';
  const description = formData.get('description')?.toString().trim() ?? '';
  const emoji = formData.get('emoji')?.toString() ?? '';
  const stars = parseInt(formData.get('stars')?.toString() ?? '3', 10);
  const status = formData.get('status')?.toString() ?? 'active';
  const accentColor = formData.get('accentColor')?.toString() ?? '';
  const threshold = parseFloat(formData.get('threshold')?.toString() ?? '0');

  const errors = validatePersonalityFields({ name, description, threshold });
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updatePersonality(id, {
      name,
      description,
      emoji,
      stars,
      status,
      accentColor,
      threshold,
    });
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to update personality. Please try again.' },
    };
  }
}

export async function deletePersonalityAction(id: number): Promise<void> {
  await deletePersonality(id);
  revalidateAdminPaths();
}
