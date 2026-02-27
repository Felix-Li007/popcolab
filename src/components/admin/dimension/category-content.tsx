'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui';
import StatsCard from '@/components/admin/stats-card';
import AdminListHeader from '@/components/admin/common/admin-list-header';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import PaginationBar from '@/components/shared/pagination-bar';
import DimensionCard from '@/components/admin/dimension/dimension-card';
import DimensionCategoryForm from '@/components/admin/dimension/category-form';
import type {
  DimensionCategory,
  DimensionCategoryFormState,
} from '@/types/dimension-type';
import {
  createDimensionCategoryAction,
  deleteDimensionCategoryAction,
  updateDimensionCategoryAction,
} from '@/actions/dimension-actions';
import styles from '@/styles/category-content.module.css';

type CategoryWithUsage = DimensionCategory & { usageCount: number };

type Props = {
  initialData: CategoryWithUsage[];
};

const PAGE_SIZE = 10;

export default function CategoryContent({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const initialId = Number(searchParams.get('id')) || null;

  const [categories, setCategories] =
    useState<CategoryWithUsage[]>(initialData);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategories(initialData);
  }, [initialData]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedCategory =
    categories.find(category => category.id === selectedId) ?? null;
  const showFormModal = isCreating || selectedId !== null;

  const totalCount = categories.length;
  const usedCount = categories.filter(
    category => category.usageCount > 0
  ).length;
  const unusedCount = totalCount - usedCount;

  function setSelection(id: number | null) {
    setSelectedId(id);
    if (id !== null) {
      router.replace(`/admin/dimensions/categories?id=${id}`, {
        scroll: false,
      });
    } else {
      router.replace('/admin/dimensions/categories', { scroll: false });
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
      !window.confirm(
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
      !window.confirm(
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
    selectedId !== null
      ? updateDimensionCategoryAction.bind(null, selectedId)
      : createDimensionCategoryAction;

  return (
    <>
      <div className={styles.root}>
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatsCard
              bgColor="bg-pink-light"
              glowColor="color-mix(in srgb, var(--color-pink-light) 55%, transparent)"
              icon={<span className="text-title">🗂️</span>}
              value={totalCount}
              label="Categories"
              trendLabel="total groups"
            />
            <StatsCard
              bgColor="bg-green-100"
              glowColor="color-mix(in srgb, var(--color-teal-accent) 55%, transparent)"
              icon={<span className="text-title">🔗</span>}
              value={usedCount}
              label="In Use"
              trendLabel="linked categories"
            />
            <StatsCard
              bgColor="bg-lavender"
              glowColor="color-mix(in srgb, var(--color-lavender) 50%, transparent)"
              icon={<span className="text-title">🧪</span>}
              value={unusedCount}
              label="Unused"
              trendLabel="safe to remove"
            />
            <StatsCard
              bgColor="bg-brand-yellow/40"
              glowColor="color-mix(in srgb, var(--color-brand-yellow) 50%, transparent)"
              icon={<span className="text-title">📐</span>}
              value={categories.reduce((sum, c) => sum + c.usageCount, 0)}
              label="Dimensions Linked"
              trendLabel="across categories"
            />
          </div>
        </div>

        <div className={styles.listSection}>
          <div className={styles.listPanel}>
            <AdminListHeader
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
                    New
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
