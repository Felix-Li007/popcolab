'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchPanel from '@/components/admin/common/search-panel';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import ExperienceCategoryForm from '@/components/admin/experience/category-form';
import ExperienceCategoryTree from '@/components/admin/experience/category-tree';
import { MAX_CATEGORY_DEPTH, MAX_CATEGORY_LEVEL } from '@/constants/category';
import type {
  ExperienceCategory,
  ExperienceCategoryOption,
  ExperienceCategoryFormState,
} from '@/types/category-type';
import {
  createExperienceCategoryAction,
  deleteExperienceCategoryAction,
  updateExperienceCategoryAction,
} from '@/actions/category-actions';
import styles from '@/styles/admin/experiences/category-content.module.css';
import {
  buildExperienceCategoryTree,
  collectCategoryDepths,
  collectDescendantIds,
  filterExperienceCategoryTree,
  flattenExperienceCategoryOptions,
  getCategorySubtreeHeight,
} from '@/utils/experience-category-tree';
import { Button, Badge } from '@/ui';

type FormIntent = 'create-root' | 'create-child' | 'edit';

type FormDraft = { intent: FormIntent; categoryId: number | null } | null;

type Props = {
  initialData: ExperienceCategory[];
};

export default function ExperienceCategoryContent({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();

  const [categories, setCategories] = useState(initialData);
  const [globalSearch, setGlobalSearch] = useState('');
  const [formDraft, setFormDraft] = useState<FormDraft>(null);

  useEffect(() => {
    setCategories(initialData);
  }, [initialData]);

  const selectedCategoryId = Number.parseInt(searchParams.get('id') ?? '', 10);

  const tree = useMemo(
    () => buildExperienceCategoryTree(categories),
    [categories]
  );

  const filteredTree = useMemo(
    () => filterExperienceCategoryTree(tree, globalSearch),
    [globalSearch, tree]
  );

  const selectedCategory =
    categories.find(category => category.id === selectedCategoryId) ?? null;

  const activeDraftCategory =
    formDraft && formDraft.categoryId !== null
      ? categories.find(category => category.id === formDraft.categoryId)
      : undefined;

  const excludedIds = useMemo(
    () =>
      activeDraftCategory
        ? collectDescendantIds(tree, activeDraftCategory.id)
        : new Set<number>(),
    [activeDraftCategory, tree]
  );

  const depthById = useMemo(() => collectCategoryDepths(tree), [tree]);

  const selectedCategoryDepth =
    selectedCategory !== null
      ? (depthById.get(selectedCategory.id) ?? 0)
      : null;

  const activeDraftSubtreeHeight =
    activeDraftCategory !== undefined
      ? getCategorySubtreeHeight(tree, activeDraftCategory.id)
      : 0;

  const maxParentDepth = MAX_CATEGORY_DEPTH - 1 - activeDraftSubtreeHeight;

  const parentOptions: ExperienceCategoryOption[] = useMemo(
    () =>
      flattenExperienceCategoryOptions(
        tree,
        excludedIds,
        Math.max(-1, maxParentDepth)
      ),
    [excludedIds, maxParentDepth, tree]
  );

  const replaceSelection = useCallback(
    (categoryId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (categoryId !== null) params.set('id', String(categoryId));
      else params.delete('id');

      const query = params.toString();
      router.replace(
        query
          ? `/admin/experiences/categories?${query}`
          : '/admin/experiences/categories',
        { scroll: false }
      );
    },
    [router, searchParams]
  );

  const openForm = useCallback(
    (intent: FormIntent, categoryId: number | null) => {
      setFormDraft({ intent, categoryId });
    },
    []
  );

  const closeForm = useCallback(() => {
    setFormDraft(null);
  }, []);

  const handleSuccess = useCallback(() => {
    router.refresh();
    closeForm();
  }, [closeForm, router]);

  const handleDelete = useCallback(
    (category: ExperienceCategory) => {
      if (
        !window.confirm(
          `Delete this category?\n\n"${category.title}"\n\nThis action cannot be undone.`
        )
      ) {
        return;
      }

      startDeleteTransition(async () => {
        try {
          await deleteExperienceCategoryAction(category.id);
          if (selectedCategory?.id === category.id) replaceSelection(null);
          router.refresh();
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to delete category. Please try again.';
          window.alert(message);
        }
      });
    },
    [replaceSelection, router, selectedCategory?.id, startDeleteTransition]
  );

  const handleSelectCategory = useCallback(
    (category: ExperienceCategory) => replaceSelection(category.id),
    [replaceSelection]
  );

  const handleEditCategory = useCallback(
    (category: ExperienceCategory) => openForm('edit', category.id),
    [openForm]
  );

  const formAction:
    | ((
        prevState: ExperienceCategoryFormState,
        formData: FormData
      ) => Promise<ExperienceCategoryFormState>)
    | undefined = formDraft
    ? formDraft.categoryId !== null
      ? updateExperienceCategoryAction.bind(null, formDraft.categoryId)
      : createExperienceCategoryAction
    : undefined;

  const modalTitle =
    formDraft?.intent === 'create-root'
      ? 'New Root Category'
      : formDraft?.intent === 'create-child'
        ? 'New Child Category'
        : 'Edit Category';

  const submitLabel =
    formDraft?.intent === 'create-root'
      ? 'Create Root'
      : formDraft?.intent === 'create-child'
        ? 'Create Child'
        : 'Save Changes';

  return (
    <div className={styles.root}>
      <section className={styles.toolbar}>
        <SearchPanel
          title="Search All Categories"
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
          searchPlaceholder="Search the full category tree by title, status, notes, or counts…"
          searchTestId="experience-category-search-global"
          actions={
            <>
              <Button
                onClick={() => openForm('create-root', null)}
                variant="primary"
                size="sm"
                icon={<span>+</span>}
              >
                New Root
              </Button>
              <Button
                onClick={() => openForm('create-child', null)}
                variant="secondary"
                size="sm"
                icon={<span>+</span>}
                disabled={
                  !selectedCategory ||
                  selectedCategoryDepth === null ||
                  selectedCategoryDepth >= MAX_CATEGORY_DEPTH
                }
              >
                Add Child
              </Button>
            </>
          }
        />
      </section>

      <div className={styles.columns}>
        <section
          className={styles.treePanel}
          data-testid="experience-category-tree-panel"
        >
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                Category Tree ({categories.length})
              </h2>
              <p className={styles.panelSubtitle}>
                Up to {MAX_CATEGORY_LEVEL} levels. Select any node to inspect it
                or add children.
              </p>
            </div>
          </div>
          <div className={styles.panelBody}>
            {filteredTree.length === 0 ? (
              <AdminEmptyState
                emoji="🌲"
                message={
                  globalSearch
                    ? 'No categories match your search.'
                    : 'No categories yet.'
                }
                testId="experience-category-tree-empty"
              />
            ) : (
              <ExperienceCategoryTree
                nodes={filteredTree}
                selectedId={selectedCategory?.id ?? null}
                onSelect={handleSelectCategory}
                onEdit={handleEditCategory}
                onDelete={handleDelete}
              />
            )}
          </div>
        </section>

        <section
          className={styles.detailPanel}
          data-testid="experience-category-detail-panel"
        >
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Details</h2>
              <p className={styles.panelSubtitle}>
                Inspect the selected node and create the next level under it
                when depth allows.
              </p>
            </div>
          </div>

          <div className={styles.detailBody}>
            {selectedCategory ? (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <div className={styles.detailMeta}>
                      #{selectedCategory.id}
                    </div>
                    <h3
                      className={styles.detailTitle}
                      data-testid="experience-category-detail-title"
                    >
                      {selectedCategory.title}
                    </h3>
                  </div>
                  <Badge
                    variant={
                      selectedCategory.status.toLowerCase() === 'active'
                        ? 'success'
                        : selectedCategory.status.toLowerCase() === 'inactive'
                          ? 'secondary'
                          : 'info'
                    }
                    size="sm"
                  >
                    {selectedCategory.status}
                  </Badge>
                </div>

                <div className={styles.detailStats}>
                  <div className={styles.detailStat}>
                    <span className={styles.detailStatLabel}>Parent</span>
                    <span className={styles.detailStatValue}>
                      {selectedCategory.parentTitle ?? 'Root level'}
                    </span>
                  </div>
                  <div className={styles.detailStat}>
                    <span className={styles.detailStatLabel}>Level</span>
                    <span className={styles.detailStatValue}>
                      {(selectedCategoryDepth ?? 0) + 1}
                    </span>
                  </div>
                  <div className={styles.detailStat}>
                    <span className={styles.detailStatLabel}>Children</span>
                    <span className={styles.detailStatValue}>
                      {selectedCategory.childCount}
                    </span>
                  </div>
                  <div className={styles.detailStat}>
                    <span className={styles.detailStatLabel}>Linked</span>
                    <span className={styles.detailStatValue}>
                      {selectedCategory.linkedExperienceCount}
                    </span>
                  </div>
                </div>

                <div className={styles.noteBox}>
                  {selectedCategory.notes?.trim() || 'No notes provided.'}
                </div>

                <div className={styles.detailActions}>
                  <Button
                    onClick={() => openForm('edit', selectedCategory.id)}
                    variant="primary"
                    size="sm"
                  >
                    Edit Category
                  </Button>
                  <Button
                    onClick={() => openForm('create-child', null)}
                    variant="secondary"
                    size="sm"
                    disabled={
                      selectedCategoryDepth === null ||
                      selectedCategoryDepth >= MAX_CATEGORY_DEPTH
                    }
                  >
                    Add Child
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedCategory)}
                    variant="text"
                    size="sm"
                    className={styles.treeDelete}
                  >
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <AdminEmptyState
                emoji="👈"
                message="Select a category from the tree to inspect or manage it."
                testId="experience-category-detail-empty"
              />
            )}
          </div>
        </section>
      </div>

      {formDraft && formAction ? (
        <ExperienceCategoryForm
          isOpen
          onClose={closeForm}
          action={formAction}
          initial={activeDraftCategory}
          parentOptions={parentOptions}
          defaultParentId={
            formDraft.intent === 'create-child'
              ? (selectedCategory?.id ?? null)
              : (activeDraftCategory?.parentId ?? null)
          }
          modalTitle={modalTitle}
          submitLabel={submitLabel}
          maxLevel={MAX_CATEGORY_LEVEL}
          onSuccess={handleSuccess}
        />
      ) : null}
    </div>
  );
}
