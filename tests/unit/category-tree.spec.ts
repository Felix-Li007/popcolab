import {
  buildExperienceCategoryTree,
  collectCategoryDepths,
  collectDescendantIds,
  filterExperienceCategoryTree,
  flattenExperienceCategoryOptions,
  getVisibleExpandedIds,
  getCategorySubtreeHeight,
} from '@/utils/experience-category-tree';
import type { ExperienceCategory } from '@/types/category-type';

const categories: ExperienceCategory[] = [
  {
    id: 1,
    title: 'Root',
    notes: null,
    status: 'active',
    parentId: null,
    parentTitle: null,
    childCount: 1,
    linkedExperienceCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: 'Child',
    notes: null,
    status: 'active',
    parentId: 1,
    parentTitle: 'Root',
    childCount: 1,
    linkedExperienceCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    title: 'Grandchild',
    notes: 'deep node',
    status: 'draft',
    parentId: 2,
    parentTitle: 'Child',
    childCount: 0,
    linkedExperienceCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('experience-category-tree helpers', () => {
  test('builds nested tree nodes', () => {
    const tree = buildExperienceCategoryTree(categories);

    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].id).toBe(2);
    expect(tree[0].children[0].children[0].id).toBe(3);
  });

  test('filters tree while preserving ancestors of matches', () => {
    const tree = buildExperienceCategoryTree(categories);
    const filtered = filterExperienceCategoryTree(tree, 'grandchild');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
    expect(filtered[0].children[0].id).toBe(2);
    expect(filtered[0].children[0].children[0].id).toBe(3);
  });

  test('flattens options and excludes a subtree', () => {
    const tree = buildExperienceCategoryTree(categories);
    const excluded = collectDescendantIds(tree, 2);
    const options = flattenExperienceCategoryOptions(tree, excluded);

    expect(options).toEqual([{ id: 1, label: 'Root', depth: 0 }]);
  });

  test('collects depths and subtree heights for level limits', () => {
    const tree = buildExperienceCategoryTree(categories);

    expect(Array.from(collectCategoryDepths(tree).entries())).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
    ]);
    expect(getCategorySubtreeHeight(tree, 1)).toBe(2);
    expect(getCategorySubtreeHeight(tree, 2)).toBe(1);
    expect(getCategorySubtreeHeight(tree, 3)).toBe(0);
    expect(flattenExperienceCategoryOptions(tree, new Set(), 1)).toEqual([
      { id: 1, label: 'Root', depth: 0 },
      { id: 2, label: '  - Child', depth: 1 },
    ]);
  });

  test('keeps collapsed nodes collapsed immediately', () => {
    const tree = buildExperienceCategoryTree(categories);

    expect(Array.from(getVisibleExpandedIds(tree, new Set()))).toEqual([1, 2]);
    expect(Array.from(getVisibleExpandedIds(tree, new Set([1])))).toEqual([2]);
    expect(Array.from(getVisibleExpandedIds(tree, new Set([1, 2])))).toEqual(
      []
    );
  });
});
