'use server';

import { revalidatePath } from 'next/cache';
import type {
  IntakeFormFormState,
  IntakeFormStatus,
} from '@/types/intake-form-type';
import { requireAdminActionAccess } from '@/services/admin-auth-service';
import {
  createIntakeForm,
  updateIntakeForm,
  deleteIntakeForm,
  validateIntakeFormFields,
} from '@/services/intake-service';

const ADMIN_PATHS = ['/admin', '/admin/questions/forms'];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function parseFormData(formData: FormData): {
  name: string;
  description: string;
  formType: string;
  status: IntakeFormStatus;
  questionIds: number[];
  dimensionIds: number[];
} {
  const name = formData.get('name')?.toString().trim() ?? '';
  const description = formData.get('description')?.toString().trim() ?? '';
  const formType = formData.get('formType')?.toString().trim() ?? '';
  const rawStatus = Number(formData.get('status')?.toString() ?? '0');
  const status = rawStatus === 1 ? 1 : 0;
  const questionIds = formData
    .getAll('questionId')
    .map(value => Number(value.toString()))
    .filter(value => Number.isInteger(value) && value > 0);
  const dimensionIds = formData
    .getAll('dimensionId')
    .map(value => Number(value.toString()))
    .filter(value => Number.isInteger(value) && value > 0);

  return {
    name,
    description,
    formType,
    status,
    questionIds,
    dimensionIds,
  };
}

export async function createIntakeFormAction(
  _prevState: IntakeFormFormState,
  formData: FormData
): Promise<IntakeFormFormState> {
  try {
    await requireAdminActionAccess();
  } catch {
    return {
      errors: {
        _form: 'Only authenticated admin users can manage intake forms.',
      },
    };
  }

  const parsed = parseFormData(formData);
  const errors = validateIntakeFormFields({
    name: parsed.name,
    description: parsed.description,
    formType: parsed.formType,
    status: parsed.status,
    questionIds: parsed.questionIds,
    dimensionIds: parsed.dimensionIds,
  });
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createIntakeForm(parsed);
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to create intake form. Please try again.' },
    };
  }
}

export async function updateIntakeFormAction(
  id: number,
  _prevState: IntakeFormFormState,
  formData: FormData
): Promise<IntakeFormFormState> {
  try {
    await requireAdminActionAccess();
  } catch {
    return {
      errors: {
        _form: 'Only authenticated admin users can manage intake forms.',
      },
    };
  }

  if (!Number.isInteger(id) || id <= 0) {
    return {
      errors: { _form: 'Invalid intake form id.' },
    };
  }

  const parsed = parseFormData(formData);
  const errors = validateIntakeFormFields({
    name: parsed.name,
    description: parsed.description,
    formType: parsed.formType,
    status: parsed.status,
    questionIds: parsed.questionIds,
    dimensionIds: parsed.dimensionIds,
  });
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updateIntakeForm(id, parsed);
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch {
    return {
      errors: { _form: 'Failed to update intake form. Please try again.' },
    };
  }
}

export async function deleteIntakeFormAction(id: number): Promise<void> {
  await requireAdminActionAccess();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid intake form id.');
  }

  await deleteIntakeForm(id);
  revalidateAdminPaths();
}
