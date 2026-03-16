import { validateExperienceCategoryFields } from '@/utils/experience-category-helper';

describe('validateExperienceCategoryFields', () => {
  test('requires a title and status', () => {
    expect(
      validateExperienceCategoryFields(
        { title: '', notes: '', status: '', parentId: null },
        { requireParent: false }
      )
    ).toEqual({
      title: 'Category title is required',
      status: 'Status is required',
    });
  });

  test('requires a parent when validating a child category', () => {
    expect(
      validateExperienceCategoryFields(
        { title: 'Ice Breakers', notes: '', status: 'active', parentId: null },
        { requireParent: true }
      )
    ).toEqual({
      parentId: 'Please select a parent category',
    });
  });

  test('enforces field length limits', () => {
    expect(
      validateExperienceCategoryFields(
        {
          title: 'x'.repeat(101),
          notes: 'y'.repeat(256),
          status: 'z'.repeat(21),
          parentId: 1,
        },
        { requireParent: true }
      )
    ).toEqual({
      title: 'Category title must be 100 characters or less',
      notes: 'Notes must be 255 characters or less',
      status: 'Status must be 20 characters or less',
    });
  });
});
