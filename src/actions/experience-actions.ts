'use server';

import { revalidatePath } from 'next/cache';
import type {
  ExperienceFormState,
  ExperienceStatus,
} from '@/types/experience-type';
import {
  createExperience,
  deleteExperience,
  updateExperience,
  validateExperienceFields,
} from '@/services/experience-service';
import {
  getNullableTrimmedFormString,
  getTrimmedFormEntryString,
  getTrimmedFormString,
} from '@/utils/form-data';

const ADMIN_PATHS = ['/admin', '/admin/experiences'];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function parseIntegerField(value: FormDataEntryValue | null): number | null {
  const text = getTrimmedFormEntryString(value);
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseExperienceForm(formData: FormData) {
  const dimensionKeys = Array.from(new Set(Array.from(formData.keys())))
    .filter(key => key.startsWith('dimension_'))
    .sort(undefined);

  const dimensionValues = dimensionKeys
    .map(key => {
      const dimensionId = Number.parseInt(key.replace('dimension_', ''), 10);
      const expectedValue = formData
        .getAll(key)
        .map(getTrimmedFormEntryString)
        .filter(Boolean)
        .join(';');

      return {
        dimensionId,
        expectedValue,
      };
    })
    .filter(
      value => Number.isInteger(value.dimensionId) && value.dimensionId > 0
    );

  return {
    experienceTitle: getTrimmedFormString(formData, 'experienceTitle'),
    experienceStatus: (getTrimmedFormString(formData, 'experienceStatus') ||
      'active') as ExperienceStatus,
    providerId: parseIntegerField(formData.get('providerId')) ?? 0,
    categoryId: parseIntegerField(formData.get('categoryId')) ?? 0,
    durationMin: parseIntegerField(formData.get('durationMin')) ?? -1,
    durationMax: parseIntegerField(formData.get('durationMax')) ?? -1,
    capacityMax: parseIntegerField(formData.get('capacityMax')) ?? -1,
    startingPrice: parseIntegerField(formData.get('startingPrice')) ?? -1,
    addingPrice: parseIntegerField(formData.get('addingPrice')) ?? -1,
    startingHour: parseIntegerField(formData.get('startingHour')),
    pricingModel: getNullableTrimmedFormString(formData, 'pricingModel'),
    pricingNotes: getNullableTrimmedFormString(formData, 'pricingNotes'),
    leadType: getTrimmedFormString(formData, 'leadType'),
    deliveryMethods: getTrimmedFormString(formData, 'deliveryMethods'),
    dietaryConsiderations: getNullableTrimmedFormString(
      formData,
      'dietaryConsiderations'
    ),
    takeItem: parseIntegerField(formData.get('takeItem')),
    travelFlying: parseIntegerField(formData.get('travelFlying')),
    dimensionValues,
  };
}

function mapExperienceError(error: unknown): ExperienceFormState['errors'] {
  if (error instanceof Error) return { _form: error.message };
  return { _form: 'Unexpected error. Please try again.' };
}

export async function createExperienceAction(
  _prevState: ExperienceFormState,
  formData: FormData
): Promise<ExperienceFormState> {
  const parsed = parseExperienceForm(formData);
  const errors = validateExperienceFields(parsed);
  if (Object.values(errors).some(error => error !== undefined))
    return { errors };

  try {
    await createExperience(parsed);
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (error) {
    return { errors: mapExperienceError(error) };
  }
}

export async function updateExperienceAction(
  id: number,
  _prevState: ExperienceFormState,
  formData: FormData
): Promise<ExperienceFormState> {
  const parsed = parseExperienceForm(formData);
  const errors = validateExperienceFields(parsed);
  if (Object.values(errors).some(error => error !== undefined))
    return { errors };

  try {
    await updateExperience(id, parsed);
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (error) {
    return { errors: mapExperienceError(error) };
  }
}

export async function deleteExperienceAction(id: number): Promise<void> {
  await deleteExperience(id);
  revalidateAdminPaths();
}
