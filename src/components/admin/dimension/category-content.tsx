'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Button } from '@/ui';
import ContentHeader from '@/components/admin/content-header';
import StatsCard from '@/components/admin/stats-card';
import AdminListHeader from '@/components/admin/common/admin-list-header';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import DimensionCategoryPanel from '@/components/admin/dimension/dimension-category-panel';
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

export default function CategoryContent({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const initialId = Number(searchParams.get('id')) || null;

  const [categories, setCategories] =
    useState<CategoryWithUsage[]>(initialData);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setCategories(initialData);
  }, [initialData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(category =>
      [category.name, category.description ?? '', String(category.usageCount)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [categories, search]);

  const selectedCategory =
    categories.find(category => category.id === selectedId) ?? null;
  const showPanel = isCreating || selectedId !== null;

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

  const panelAction: (
    prevState: DimensionCategoryFormState,
    formData: FormData
  ) => Promise<DimensionCategoryFormState> =
    selectedId !== null
      ? updateDimensionCategoryAction.bind(null, selectedId)
      : createDimensionCategoryAction;

  return (
    <>
      <div className="flex flex-col">
        <div className="p-4 pb-0 shrink-0">
          <ContentHeader
            emoji="🗂️"
            title={
              <>
                Dimension <span className="text-magenta">Categories</span>
              </>
            }
            subtitle={`${totalCount} categories · ${usedCount} used · ${unusedCount} unused`}
            actions={
              <Button
                onClick={handleCreate}
                variant="primary"
                size="md"
                icon={<span>+</span>}
              >
                New Category
              </Button>
            }
          />
        </div>

        <div className="px-4 pt-3 shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

        <div className="flex flex-1 min-h-0 px-4 py-3 gap-4">
          <div
            className={`${styles.listPanel} border border-gray-200 flex flex-col bg-white z-10 shadow-sm rounded-2xl overflow-hidden`}
          >
            <AdminListHeader
              title={`Categories (${filtered.length})`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search categories…"
              searchTestId="dimension-category-search"
              actions={
                <Button
                  onClick={handleCreate}
                  variant="primary"
                  size="sm"
                  icon={<span>+</span>}
                >
                  Add
                </Button>
              }
            />

            <div className="flex-1 overflow-y-auto">
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
                <ul className="divide-y divide-gray-100">
                  {filtered.map(category => {
                    const isSelected =
                      category.id === selectedId && !isCreating;
                    return (
                      <li key={category.id} className={styles.listItem}>
                        <div
                          className={`px-4 py-3 border-l-4 transition-all ${
                            isSelected
                              ? 'border-magenta bg-magenta/[.06]'
                              : 'border-transparent hover:bg-magenta/[.03]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelection(category.id);
                                setIsCreating(false);
                              }}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <Badge
                                  variant={
                                    category.usageCount > 0
                                      ? 'success'
                                      : 'secondary'
                                  }
                                  size="xs"
                                >
                                  {category.usageCount} linked
                                </Badge>
                              </div>
                              <p
                                className={`text-body leading-snug ${
                                  isSelected
                                    ? 'text-gray-900 font-semibold'
                                    : 'text-gray-700'
                                }`}
                              >
                                {category.name}
                              </p>
                              {category.description && (
                                <p className="text-caption text-gray-500 mt-0.5 line-clamp-2">
                                  {category.description}
                                </p>
                              )}
                            </button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="!h-7 !min-w-0 !px-2 hover:!text-red-500"
                              onClick={() => handleDelete(category)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div
            className={`${styles.editPanel} bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm`}
          >
            {showPanel ? (
              <DimensionCategoryPanel
                key={isCreating ? 'new' : String(selectedId)}
                action={panelAction}
                isEdit={!isCreating && selectedId !== null}
                initial={
                  isCreating ? undefined : (selectedCategory ?? undefined)
                }
                usageCount={
                  isCreating ? 0 : (selectedCategory?.usageCount ?? 0)
                }
                onSuccess={handleSuccess}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
                <span className="text-display">🗂️</span>
                <p className="text-heading font-semibold text-gray-600">
                  Select a category to edit
                </p>
                <p className="text-body text-gray-400">
                  or click <strong>+ Add</strong> to create a new one
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
