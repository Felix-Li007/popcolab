import type { ExperienceCategoryFormState } from '@/types/category-type';

type ValidateOptions = {
  requireParent?: boolean;
};

export function validateExperienceCategoryFields(
  fields: {
    title: string;
    notes: string;
    status: string;
    parentId: number | null;
  },
  options: ValidateOptions = {}
): ExperienceCategoryFormState['errors'] {
  const errors: ExperienceCategoryFormState['errors'] = {};

  if (!fields.title) errors.title = 'Category title is required';
  else if (fields.title.length > 100)
    errors.title = 'Category title must be 100 characters or less';

  if (fields.notes.length > 255) {
    errors.notes = 'Notes must be 255 characters or less';
  }

  if (!fields.status) errors.status = 'Status is required';
  else if (fields.status.length > 20)
    errors.status = 'Status must be 20 characters or less';

  if (options.requireParent) {
    if (!Number.isInteger(fields.parentId) || (fields.parentId ?? 0) <= 0) {
      errors.parentId = 'Please select a parent category';
    }
  } else if (fields.parentId !== null) {
    if (!Number.isInteger(fields.parentId) || fields.parentId <= 0) {
      errors.parentId = 'Parent category is invalid';
    }
  }

  return errors;
}
