'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui';
import SearchPanel from '@/components/admin/common/search-panel';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import PaginationBar from '@/components/shared/pagination-bar';
import DimensionCard from '@/components/admin/dimension/dimension-card';
import DimensionForm from '@/components/admin/dimension/dimension-edit';
import DimensionView from '@/components/admin/dimension/dimension-view';
import DimensionCategoryFilterBar from '@/components/admin/dimension/category-filter';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import type {
  Dimension,
  DimensionCategory,
  DimensionFormState,
} from '@/types/dimension-type';
import {
  createDimensionAction,
  deleteDimensionAction,
  updateDimensionAction,
} from '@/actions/dimension-actions';
import styles from '@/styles/dimension-content.module.css';

type Props = {
  initialData: Dimension[];
  categories: DimensionCategory[];
  summary?: {
    count: number;
    hardFilterCount: number;
    scaleCount: number;
    categoryCount: number;
  };
};

type CategoryFilter = 'all' | number;

export default function DimensionContent({ initialData, categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const [dimensions, setDimensions] = useState<Dimension[]>(initialData);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [hardOnly, setHardOnly] = useState(false);
  const idParam = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [viewId, setViewId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setDimensions(initialData);
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
  }, [search, categoryFilter, hardOnly]);

  const categoryCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const d of dimensions) {
      map.set(d.categoryId, (map.get(d.categoryId) ?? 0) + 1);
    }
    return map;
  }, [dimensions]);

  const orderedDimensions = useMemo(
    () => [...dimensions].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
    [dimensions]
  );

  const filtered = orderedDimensions.filter(d => {
    const matchCategory =
      categoryFilter === 'all' || d.categoryId === categoryFilter;
    const matchHardOnly = !hardOnly || d.hardFilter;
    const q = search.trim().toLowerCase();
    if (!q) return matchCategory && matchHardOnly;

    const haystack = [
      d.indexKey ?? '',
      d.indexName,
      d.categoryName,
      d.dataType,
      d.indexNotes ?? '',
      ...d.options.flatMap(opt => [opt.label, opt.value]),
    ]
      .join(' ')
      .toLowerCase();

    return matchCategory && matchHardOnly && haystack.includes(q);
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / DEFAULT_PAGE_SIZE)
  );
  const paginated = filtered.slice(
    (page - 1) * DEFAULT_PAGE_SIZE,
    page * DEFAULT_PAGE_SIZE
  );

  const selectedDimension = dimensions.find(d => d.id === selectedId) ?? null;
  const viewedDimension = dimensions.find(d => d.id === viewId) ?? null;
  const showFormModal = isCreating || selectedId !== null;

  function setSelection(id: number | null) {
    setSelectedId(id);
    if (id !== null) {
      router.replace(`/admin/dimensions?id=${id}`, { scroll: false });
    } else {
      router.replace('/admin/dimensions', { scroll: false });
    }
  }

  function handleCreate() {
    setSelection(null);
    setIsCreating(true);
  }

  function handleSuccess() {
    const wasCreating = isCreating;
    router.refresh();
    setIsCreating(false);
    setSelection(null);
    if (wasCreating) {
      setSearch('');
      setCategoryFilter('all');
      setHardOnly(false);
      setPage(1);
    }
  }

  function handleCloseForm() {
    setIsCreating(false);
    setSelection(null);
  }

  function handleSelectToggle(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete(id: number, name: string) {
    if (
      !window.confirm(
        `Delete this dimension?\n\n"${name}"\n\nRelated mappings will also be removed.`
      )
    )
      return;

    startDeleteTransition(async () => {
      try {
        await deleteDimensionAction(id);
        if (selectedId === id) setSelection(null);
        if (viewId === id) setViewId(null);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setIsCreating(false);
        router.refresh();
      } catch {
        alert('Failed to delete dimension. Please try again.');
      }
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Delete ${ids.length} selected dimension(s)?\n\nRelated mappings will also be removed.`
      )
    )
      return;

    startDeleteTransition(async () => {
      try {
        for (const id of ids) {
          await deleteDimensionAction(id);
        }
        if (selectedId !== null && ids.includes(selectedId)) setSelection(null);
        if (viewId !== null && ids.includes(viewId)) setViewId(null);
        setSelectedIds(new Set());
        setIsCreating(false);
        router.refresh();
      } catch {
        alert('Failed to delete selected dimensions. Please try again.');
      }
    });
  }

  const panelAction: (
    prevState: DimensionFormState,
    formData: FormData
  ) => Promise<DimensionFormState> =
    selectedId !== null
      ? updateDimensionAction.bind(null, selectedId)
      : createDimensionAction;

  return (
    <>
      <div className={styles.root}>
        <div className={styles.listSection}>
          <div className={styles.listPanel}>
            <SearchPanel
              title={`Dimensions (${filtered.length})`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search dimensions…"
              searchTestId="dimension-search"
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
                    className={styles.deleteButton}
                    disabled={selectedIds.size === 0}
                  >
                    Delete
                    {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                  </Button>
                </>
              }
            />

            <DimensionCategoryFilterBar
              categories={categories}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              categoryCountMap={categoryCountMap}
              totalCount={dimensions.length}
              hardOnly={hardOnly}
              onHardOnlyChange={setHardOnly}
            />

            <div className={styles.listBody}>
              {filtered.length === 0 ? (
                <AdminEmptyState
                  emoji="📐"
                  message={
                    search
                      ? 'No dimensions match your search.'
                      : 'No dimensions yet.'
                  }
                  testId="dimension-empty"
                />
              ) : (
                <div className={styles.cardsWrap}>
                  <div className={styles.cardsGrid}>
                    {paginated.map(dimension => {
                      const selectedForBulk = dimension.id
                        ? selectedIds.has(dimension.id)
                        : false;
                      const isEditingSelected =
                        dimension.id === selectedId && !isCreating;
                      const dimensionId = dimension.id;
                      if (!dimensionId) return null;

                      return (
                        <DimensionCard
                          key={dimensionId}
                          dimension={dimension}
                          isEditingSelected={isEditingSelected}
                          isBulkSelected={selectedForBulk}
                          onSelect={() => {
                            setSelection(dimensionId);
                            setIsCreating(false);
                          }}
                          onToggleSelect={() => handleSelectToggle(dimensionId)}
                          onView={() => setViewId(dimensionId)}
                          onDelete={() =>
                            handleDelete(dimensionId, dimension.indexName)
                          }
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

      <DimensionForm
        isOpen={showFormModal}
        onClose={handleCloseForm}
        action={panelAction}
        isEdit={!isCreating && selectedId !== null}
        initial={isCreating ? undefined : (selectedDimension ?? undefined)}
        categories={categories}
        onSuccess={handleSuccess}
      />

      <DimensionView
        isOpen={viewId !== null}
        dimension={viewedDimension}
        onClose={() => setViewId(null)}
        onEdit={id => {
          setViewId(null);
          setSelection(id);
          setIsCreating(false);
        }}
      />
    </>
  );
}
