'use server';

import { prisma } from '@/libs/prisma-client';
import { revalidatePath } from 'next/cache';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type PersonalityData = {
  id?: number;
  type: string;
  name: string;
  description: string;
  emoji: string;
  stars: number;
  status: 'active' | 'draft';
  accentColor?: string;
  threshold: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PersonalityFormState = {
  errors: {
    name?: string;
    type?: string;
    description?: string;
    threshold?: string;
    _form?: string;
  };
  success?: boolean;
};

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(fields: {
  name: string;
  type?: string;
  description: string;
  threshold: number;
}): PersonalityFormState['errors'] {
  const errors: PersonalityFormState['errors'] = {};

  if (!fields.name) errors.name = 'Name is required';
  else if (fields.name.length > 50)
    errors.name = 'Name must be 50 characters or less';

  if (fields.type !== undefined) {
    if (!fields.type) errors.type = 'Tag / Type is required';
    else if (fields.type.length > 50)
      errors.type = 'Tag must be 50 characters or less';
    else if (!/^[A-Z0-9_]+$/.test(fields.type))
      errors.type =
        'Tag must only contain uppercase letters, numbers or underscores';
  }

  if (!fields.description) errors.description = 'Description is required';
  else if (fields.description.length > 255)
    errors.description = 'Description must be 255 characters or less';

  if (isNaN(fields.threshold) || fields.threshold < 0)
    errors.threshold = 'Threshold must be a non-negative number';

  return errors;
}

// ─── Create ──────────────────────────────────────────────────────────────────

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

  const errors = validate({ name, type, description, threshold });
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await prisma.personalityType.create({
      data: {
        personality_key: type,
        personality_name: name,
        personality_desc: description,
        emoji,
        stars,
        status,
        accent_color: accentColor,
        score_threshold: threshold,
      },
    });
    revalidatePath('/admin');
    revalidatePath('/admin/personalities');
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

// ─── Update ──────────────────────────────────────────────────────────────────

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

  // type is disabled in edit mode — only validate name & description
  const errors = validate({ name, description, threshold });
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await prisma.personalityType.update({
      where: { id },
      data: {
        personality_name: name,
        personality_desc: description,
        emoji,
        stars,
        status,
        accent_color: accentColor,
        score_threshold: threshold,
      },
    });
    revalidatePath('/admin');
    revalidatePath('/admin/personalities');
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to update personality. Please try again.' },
    };
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deletePersonalityAction(id: number): Promise<void> {
  await prisma.personalityType.delete({ where: { id } });
  revalidatePath('/admin');
  revalidatePath('/admin/personalities');
}
