'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { Badge, Button } from '@/ui';
import type {
  ExperienceCategory,
  ExperienceCategoryTreeNode,
} from '@/types/category-type';
import styles from '@/styles/admin/experiences/category-content.module.css';
import { getVisibleExpandedIds } from '@/utils/experience-category-tree';

type Props = {
  nodes: ExperienceCategoryTreeNode[];
  selectedId: number | null;
  onSelect: (category: ExperienceCategory) => void;
  onEdit: (category: ExperienceCategory) => void;
  onDelete: (category: ExperienceCategory) => void;
};

function statusVariant(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'success';
  if (normalized === 'inactive') return 'secondary';
  return 'info';
}

function EditIcon() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

type TreeNodeProps = {
  node: ExperienceCategoryTreeNode;
  depth: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelect: (category: ExperienceCategory) => void;
  onEdit: (category: ExperienceCategory) => void;
  onDelete: (category: ExperienceCategory) => void;
};

function TreeNodeComponent({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
}: Readonly<TreeNodeProps>) {
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <li
      className={styles.treeNode}
      data-testid="experience-category-tree-node"
      data-category-id={node.id}
    >
      <div
        className={`${styles.treeRow} ${isSelected ? styles.treeRowActive : ''}`}
        style={{ paddingLeft: `${0.75 + depth * 1.15}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.treeToggle}
            data-testid={`experience-category-toggle-${node.id}`}
            onClick={event => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            aria-label={isExpanded ? 'Collapse submenu' : 'Expand submenu'}
            aria-expanded={isExpanded}
          >
            <svg
              className={`${styles.treeToggleIcon} ${isExpanded ? styles.treeToggleIconOpen : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <span className={styles.treeToggleSpacer} aria-hidden="true" />
        )}

        <button
          type="button"
          className={styles.treeMain}
          data-testid={`experience-category-select-${node.id}`}
          onClick={() => onSelect(node)}
        >
          <div className={styles.treeTitleRow}>
            <span
              className={styles.treeTitle}
              data-testid={`experience-category-title-${node.id}`}
            >
              {node.title}
            </span>
            <Badge variant={statusVariant(node.status)} size="xs">
              {node.status}
            </Badge>
          </div>
          <div className={styles.treeMeta}>
            <span>#{node.id}</span>
            <span>Children: {node.childCount}</span>
            <span>Linked: {node.linkedExperienceCount}</span>
          </div>
        </button>

        <div className={styles.treeActions}>
          <Button
            variant="text"
            size="xs"
            icon={<EditIcon />}
            onClick={event => {
              event.stopPropagation();
              onEdit(node);
            }}
          >
            Edit
          </Button>
          <Button
            variant="text"
            size="xs"
            className={styles.treeDelete}
            icon={<DeleteIcon />}
            onClick={event => {
              event.stopPropagation();
              onDelete(node);
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <ul className={styles.treeChildren}>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

const TreeNode = memo(TreeNodeComponent, (prev, next) => {
  if (prev.node !== next.node) return false;
  if (prev.depth !== next.depth) return false;
  if (
    prev.expandedIds.has(prev.node.id) !== next.expandedIds.has(next.node.id)
  ) {
    return false;
  }
  if (
    (prev.selectedId === prev.node.id) !==
    (next.selectedId === next.node.id)
  ) {
    return false;
  }

  return true;
});

export default function ExperienceCategoryTree({
  nodes,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: Readonly<Props>) {
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(
    () => new Set()
  );
  const visibleExpandedIds = useMemo(() => {
    return getVisibleExpandedIds(nodes, collapsedIds);
  }, [collapsedIds, nodes]);

  const toggleNode = useCallback((id: number) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <ul className={styles.treeList} data-testid="experience-category-tree">
      {nodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          expandedIds={visibleExpandedIds}
          onToggle={toggleNode}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
