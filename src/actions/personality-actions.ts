'use server';

import { revalidatePath } from 'next/cache';
import type { PersonalityFormState } from '@/types/personality-type';
import {
  validatePersonalityFields,
  createPersonality,
  updatePersonality,
  deletePersonality,
} from '@/services/personality-service';
import { getFormEntryString, getTrimmedFormString } from '@/utils/form-data';

const ADMIN_PATHS = ['/admin', '/admin/personalities'];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

export async function createPersonalityAction(
  _prevState: PersonalityFormState,
  formData: FormData
): Promise<PersonalityFormState> {
  const name = getTrimmedFormString(formData, 'name');
  const type = getTrimmedFormString(formData, 'type').toUpperCase();
  const description = getTrimmedFormString(formData, 'description');
  const emoji = getFormEntryString(formData.get('emoji'));
  const status = getFormEntryString(formData.get('status')) || 'active';
  const accentColor = getFormEntryString(formData.get('accentColor'));
  const threshold = Number.parseFloat(
    getFormEntryString(formData.get('threshold')) || '0'
  );

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
  const name = getTrimmedFormString(formData, 'name');
  const description = getTrimmedFormString(formData, 'description');
  const emoji = getFormEntryString(formData.get('emoji'));
  const status = getFormEntryString(formData.get('status')) || 'active';
  const accentColor = getFormEntryString(formData.get('accentColor'));
  const threshold = Number.parseFloat(
    getFormEntryString(formData.get('threshold')) || '0'
  );

  const errors = validatePersonalityFields({ name, description, threshold });
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updatePersonality(id, {
      name,
      description,
      emoji,
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
