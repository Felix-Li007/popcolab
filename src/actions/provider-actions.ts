'use server';

import { revalidatePath } from 'next/cache';
import type { ProviderFormState } from '@/types/provider-type';
import {
  createProvider,
  deleteProvider,
  normalizeProviderType,
  updateProvider,
  validateProviderFields,
} from '@/services/provider-service';

const ADMIN_PATHS = [
  '/admin',
  '/admin/experiences',
  '/admin/experiences/providers',
];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function parseProviderForm(formData: FormData) {
  const providerLabel = formData.get('providerLabel')?.toString().trim() ?? '';
  const providerTypeRaw = formData.get('providerType')?.toString().trim() ?? '';
  const providerNotesRaw =
    formData.get('providerNotes')?.toString().trim() ?? '';
  const pricingNotesRaw = formData.get('pricingNotes')?.toString().trim() ?? '';

  return {
    providerLabel,
    providerType: normalizeProviderType(providerTypeRaw),
    providerNotes: providerNotesRaw === '' ? null : providerNotesRaw,
    pricingNotes: pricingNotesRaw === '' ? null : pricingNotesRaw,
  };
}

function mapProviderError(error: unknown): ProviderFormState['errors'] {
  if (error instanceof Error) {
    if (error.message === 'A provider with this type already exists.') {
      return { providerType: error.message };
    }

    return { _form: error.message };
  }

  return { _form: 'Unexpected error. Please try again.' };
}

export async function createProviderAction(
  _prevState: ProviderFormState,
  formData: FormData
): Promise<ProviderFormState> {
  const parsed = parseProviderForm(formData);
  const errors = validateProviderFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createProvider(parsed);
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (error) {
    return { errors: mapProviderError(error) };
  }
}

export async function updateProviderAction(
  id: number,
  _prevState: ProviderFormState,
  formData: FormData
): Promise<ProviderFormState> {
  const parsed = parseProviderForm(formData);
  const errors = validateProviderFields(parsed);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updateProvider(id, parsed);
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (error) {
    return { errors: mapProviderError(error) };
  }
}

export async function deleteProviderAction(id: number): Promise<void> {
  await deleteProvider(id);
  revalidateAdminPaths();
}
