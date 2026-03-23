'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui';
import SearchPanel from '@/components/admin/common/search-panel';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import PaginationBar from '@/components/shared/pagination-bar';
import DimensionCard from '@/components/admin/dimension/dimension-card';
import DimensionCategoryForm from '@/components/admin/dimension/category-edit';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import type {
  DimensionCategory,
  DimensionCategoryFormState,
} from '@/types/dimension-type';
import {
  createDimensionCategoryAction,
  deleteDimensionCategoryAction,
  updateDimensionCategoryAction,
} from '@/actions/dimension-actions';
import styles from '@/styles/admin/dimensions/category-content.module.css';

type CategoryWithUsage = DimensionCategory & { usageCount: number };

type Props = {
  initialData: CategoryWithUsage[];
};

export default function CategoryContent({ initialData }: Readonly<Props>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const idParam = searchParams.get('id');

  const [categories, setCategories] =
    useState<CategoryWithUsage[]>(initialData);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategories(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!idParam || !/^\d+$/.test(idParam)) {
      setSelectedId(null);
      return;
    }
    setSelectedId(Number(idParam));
    setIsCreating(false);
  }, [idParam]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setSelectedIds(prev => {
      const validIds = new Set(categories.map(category => category.id));
      const next = new Set<number>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ordered = [...categories].sort((a, b) => b.id - a.id);
    if (!q) return ordered;
    return ordered.filter(category =>
      [category.name, category.description ?? '', String(category.usageCount)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [categories, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / DEFAULT_PAGE_SIZE)
  );
  const paginated = filtered.slice(
    (page - 1) * DEFAULT_PAGE_SIZE,
    page * DEFAULT_PAGE_SIZE
  );

  const selectedCategory =
    categories.find(category => category.id === selectedId) ?? null;
  const showFormModal = isCreating || selectedId !== null;

  function setSelection(id: number | null) {
    setSelectedId(id);
    if (id === null) {
      router.replace('/admin/dimensions/categories', { scroll: false });
    } else {
      router.replace(`/admin/dimensions/categories?id=${id}`, {
        scroll: false,
      });
    }
  }

  function handleCreate() {
    setSelection(null);
    setIsCreating(true);
  }

  function handleSuccess() {
    router.refresh();
    setIsCreating(false);
    setSelection(null);
  }

  function handleCloseForm() {
    setIsCreating(false);
    setSelection(null);
  }

  function handleDelete(category: CategoryWithUsage) {
    if (category.usageCount > 0) {
      alert('This category is currently in use and cannot be deleted.');
      return;
    }

    if (
      !globalThis.confirm(
        `Delete this category?\n\n"${category.name}"\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        await deleteDimensionCategoryAction(category.id);
        if (selectedId === category.id) setSelection(null);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(category.id);
          return next;
        });
        setIsCreating(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete category. Please try again.';
        alert(message);
      }
    });
  }

  function handleSelectToggle(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const selectedCategories = categories.filter(category =>
      selectedIds.has(category.id)
    );
    const blocked = selectedCategories.filter(
      category => category.usageCount > 0
    );
    if (blocked.length > 0) {
      const blockedNames = blocked
        .slice(0, 3)
        .map(category => `"${category.name}"`)
        .join(', ');
      const moreText = blocked.length > 3 ? ' and more.' : '.';
      alert(
        `Some selected categories are in use and cannot be deleted: ${blockedNames}${moreText}`
      );
      return;
    }

    if (
      !globalThis.confirm(
        `Delete ${ids.length} selected categor${ids.length > 1 ? 'ies' : 'y'}?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        for (const id of ids) {
          await deleteDimensionCategoryAction(id);
        }
        if (selectedId !== null && ids.includes(selectedId)) setSelection(null);
        setSelectedIds(new Set());
        setIsCreating(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete selected categories. Please try again.';
        alert(message);
      }
    });
  }

  const panelAction: (
    prevState: DimensionCategoryFormState,
    formData: FormData
  ) => Promise<DimensionCategoryFormState> =
    selectedId === null
      ? createDimensionCategoryAction
      : updateDimensionCategoryAction.bind(null, selectedId);

  return (
    <>
      <div className={styles.root}>
        <div className={styles.listSection}>
          <div className={styles.listPanel}>
            <SearchPanel
              title={`Categories (${filtered.length})`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search categories…"
              searchTestId="dimension-category-search"
              actions={
                <>
                  <Button
                    onClick={handleCreate}
                    variant="primary"
                    size="sm"
                    icon={<span>+</span>}
                  >
                    Add
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    variant="secondary"
                    size="sm"
                    className="hover:!text-red-500"
                    disabled={selectedIds.size === 0}
                  >
                    Delete
                    {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                  </Button>
                </>
              }
            />

            <div className={styles.listBody}>
              {filtered.length === 0 ? (
                <AdminEmptyState
                  emoji="🗂️"
                  message={
                    search
                      ? 'No categories match your search.'
                      : 'No categories yet.'
                  }
                  testId="category-empty"
                />
              ) : (
                <div className={styles.cardsWrap}>
                  <div className={styles.cardsGrid}>
                    {paginated.map(category => {
                      const isSelected =
                        category.id === selectedId && !isCreating;
                      const selectedForBulk = selectedIds.has(category.id);
                      return (
                        <DimensionCard
                          key={category.id}
                          variant="category"
                          category={category}
                          isEditingSelected={isSelected}
                          isBulkSelected={selectedForBulk}
                          onSelect={() => {
                            setSelection(category.id);
                            setIsCreating(false);
                          }}
                          onToggleSelect={() => handleSelectToggle(category.id)}
                          onDelete={() => handleDelete(category)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <PaginationBar
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      <DimensionCategoryForm
        isOpen={showFormModal}
        onClose={handleCloseForm}
        action={panelAction}
        isEdit={!isCreating && selectedId !== null}
        initial={isCreating ? undefined : (selectedCategory ?? undefined)}
        usageCount={isCreating ? 0 : (selectedCategory?.usageCount ?? 0)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
