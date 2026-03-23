import type {
  ExperienceCategory,
  ExperienceCategoryOption,
  ExperienceCategoryTreeNode,
} from '@/types/category-type';

function compareCategories(a: ExperienceCategory, b: ExperienceCategory) {
  return a.title.localeCompare(b.title) || a.id - b.id;
}

export function collectExpandableIds(
  nodes: ExperienceCategoryTreeNode[]
): Set<number> {
  const ids = new Set<number>();

  const visit = (tree: ExperienceCategoryTreeNode[]) => {
    for (const node of tree) {
      if (node.children.length > 0) ids.add(node.id);
      visit(node.children);
    }
  };

  visit(nodes);
  return ids;
}

export function buildExperienceCategoryTree(
  categories: ExperienceCategory[]
): ExperienceCategoryTreeNode[] {
  const nodeById = new Map<number, ExperienceCategoryTreeNode>();

  for (const category of categories) {
    nodeById.set(category.id, {
      ...category,
      children: [],
    });
  }

  const roots: ExperienceCategoryTreeNode[] = [];

  for (const category of categories) {
    const node = nodeById.get(category.id);
    if (!node) continue;

    if (category.parentId === null) {
      roots.push(node);
      continue;
    }

    const parent = nodeById.get(category.parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    parent.children.push(node);
  }

  function sortNodes(nodes: ExperienceCategoryTreeNode[]) {
    nodes.sort(compareCategories);
    for (const node of nodes) sortNodes(node.children);
  }

  sortNodes(roots);
  return roots;
}

export function filterExperienceCategoryTree(
  nodes: ExperienceCategoryTreeNode[],
  query: string
): ExperienceCategoryTreeNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;

  const matches = (category: ExperienceCategory) =>
    [
      category.title,
      category.notes ?? '',
      category.status,
      category.parentTitle ?? '',
      String(category.childCount),
      String(category.linkedExperienceCount),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalized);

  const filterNodes = (
    tree: ExperienceCategoryTreeNode[]
  ): ExperienceCategoryTreeNode[] =>
    tree.flatMap(node => {
      const children = filterNodes(node.children);

      if (!matches(node) && children.length === 0) return [];

      return [{ ...node, children }];
    });

  return filterNodes(nodes);
}

export function collectDescendantIds(
  nodes: ExperienceCategoryTreeNode[],
  targetId: number
): Set<number> {
  const ids = new Set<number>();

  const visit = (tree: ExperienceCategoryTreeNode[]): boolean => {
    for (const node of tree) {
      if (node.id === targetId) {
        collect(node);
        return true;
      }

      if (visit(node.children)) return true;
    }

    return false;
  };

  const collect = (node: ExperienceCategoryTreeNode) => {
    ids.add(node.id);
    for (const child of node.children) collect(child);
  };

  visit(nodes);
  return ids;
}

export function flattenExperienceCategoryOptions(
  nodes: ExperienceCategoryTreeNode[],
  excludedIds: Set<number> = new Set(),
  maxDepth: number = Number.POSITIVE_INFINITY
): ExperienceCategoryOption[] {
  const options: ExperienceCategoryOption[] = [];

  const visit = (tree: ExperienceCategoryTreeNode[], depth: number) => {
    for (const node of tree) {
      if (!excludedIds.has(node.id) && depth <= maxDepth) {
        const indent = depth > 0 ? `${'  '.repeat(depth)}- ` : '';
        options.push({
          id: node.id,
          label: `${indent}${node.title}`,
          depth,
        });
      }

      visit(node.children, depth + 1);
    }
  };

  visit(nodes, 0);
  return options;
}

export function collectCategoryDepths(
  nodes: ExperienceCategoryTreeNode[]
): Map<number, number> {
  const depths = new Map<number, number>();

  const visit = (tree: ExperienceCategoryTreeNode[], depth: number) => {
    for (const node of tree) {
      depths.set(node.id, depth);
      visit(node.children, depth + 1);
    }
  };

  visit(nodes, 0);
  return depths;
}

export function getCategorySubtreeHeight(
  nodes: ExperienceCategoryTreeNode[],
  targetId: number
): number {
  const visit = (tree: ExperienceCategoryTreeNode[]): number | null => {
    for (const node of tree) {
      if (node.id === targetId) return getHeight(node);
      const childHeight = visit(node.children);
      if (childHeight !== null) return childHeight;
    }

    return null;
  };

  const getHeight = (node: ExperienceCategoryTreeNode): number =>
    node.children.length === 0
      ? 0
      : 1 + Math.max(...node.children.map(getHeight));

  return visit(nodes) ?? 0;
}

export function getVisibleExpandedIds(
  nodes: ExperienceCategoryTreeNode[],
  collapsedIds: Set<number>
): Set<number> {
  const next = new Set<number>();
  const expandableIds = collectExpandableIds(nodes);

  for (const id of expandableIds) {
    if (!collapsedIds.has(id)) {
      next.add(id);
    }
  }

  return next;
}
