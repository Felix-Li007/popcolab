'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchPanel from '@/components/admin/common/search-panel';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import PaginationBar from '@/components/shared/pagination-bar';
import ExperienceCard from '@/components/admin/experience/experience-card';
import ExperienceForm from '@/components/admin/experience/experience-form';
import ExperienceView from '@/components/admin/experience/experience-view';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import {
  createExperienceAction,
  deleteExperienceAction,
  updateExperienceAction,
} from '@/actions/experience-actions';
import type { ExperienceCategory } from '@/types/category-type';
import type { Dimension } from '@/types/dimension-type';
import type { Provider } from '@/types/provider-type';
import type {
  Experience,
  ExperienceFormState,
  ExperienceStatus,
} from '@/types/experience-type';
import { Button } from '@/ui';
import { isNewExperience } from '@/utils/experience';
import styles from '@/styles/admin/experiences/experience-content.module.css';

const CAPACITY_FILTERS = [
  { value: 'all', label: 'All Capacity' },
  { value: '1-10', label: '1-10' },
  { value: '11-25', label: '11-25' },
  { value: '26-50', label: '26-50' },
  { value: '51-100', label: '51-100' },
  { value: '101+', label: '101+' },
] as const;

const DURATION_FILTERS = [
  { value: 'all', label: 'All Duration' },
  { value: '0-30', label: '0-30 min' },
  { value: '31-60', label: '31-60 min' },
  { value: '61-90', label: '61-90 min' },
  { value: '91-120', label: '91-120 min' },
  { value: '121+', label: '121+ min' },
] as const;

type CapacityFilter = (typeof CAPACITY_FILTERS)[number]['value'];
type DurationFilter = (typeof DURATION_FILTERS)[number]['value'];
type StatusFilter = 'all' | ExperienceStatus;

type Props = {
  initialData: Experience[];
  providers: Provider[];
  categories: ExperienceCategory[];
  dimensions: Dimension[];
};

function matchesRange(
  value: number,
  filterValue: string,
  ranges: readonly { value: string }[]
) {
  if (
    filterValue === 'all' ||
    !ranges.some(range => range.value === filterValue)
  ) {
    return true;
  }

  if (filterValue.endsWith('+')) {
    const min = Number.parseInt(filterValue.replace('+', ''), 10);
    return value >= min;
  }

  const [minText, maxText] = filterValue.split('-');
  const min = Number.parseInt(minText, 10);
  const max = Number.parseInt(maxText, 10);
  return value >= min && value <= max;
}

function parseDeliveryMethodTokens(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,;|]+/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

export default function ExperienceContent({
  initialData,
  providers,
  categories,
  dimensions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const [experiences, setExperiences] = useState<Experience[]>(initialData);
  const [search, setSearch] = useState('');
  const idParam = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [newOnly, setNewOnly] = useState(false);

  useEffect(() => {
    setExperiences(initialData);
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
  }, [
    search,
    capacityFilter,
    leadTypeFilter,
    deliveryMethodFilter,
    durationFilter,
    statusFilter,
    newOnly,
  ]);

  const leadTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          experiences
            .map(experience => experience.leadType.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [experiences]
  );

  const deliveryMethodOptions = useMemo(
    () =>
      Array.from(
        new Set(
          experiences.flatMap(experience =>
            parseDeliveryMethodTokens(experience.deliveryMethods)
          )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [experiences]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...experiences]
      .sort((a, b) => {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (aUpdated !== bUpdated) return bUpdated - aUpdated;
        if (a.popularityIndex !== b.popularityIndex) {
          return b.popularityIndex - a.popularityIndex;
        }
        return b.id - a.id;
      })
      .filter(experience => {
        const matchesSearch =
          !query ||
          [
            experience.experienceTitle,
            experience.providerLabel,
            experience.categoryTitle,
            experience.leadType,
            experience.deliveryMethods,
            experience.dietaryConsiderations ?? '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(query);

        const matchesCapacity = matchesRange(
          experience.capacityMax,
          capacityFilter,
          CAPACITY_FILTERS
        );

        const matchesLeadType =
          leadTypeFilter === 'all' || experience.leadType === leadTypeFilter;

        const matchesDeliveryMethod =
          deliveryMethodFilter === 'all' ||
          parseDeliveryMethodTokens(experience.deliveryMethods).includes(
            deliveryMethodFilter
          );

        const matchesDuration =
          durationFilter === 'all' ||
          matchesRange(
            experience.durationMax,
            durationFilter,
            DURATION_FILTERS
          );
        const matchesStatus =
          statusFilter === 'all' ||
          experience.experienceStatus === statusFilter;
        const matchesNew = !newOnly || isNewExperience(experience.createdAt);

        return (
          matchesSearch &&
          matchesCapacity &&
          matchesLeadType &&
          matchesDeliveryMethod &&
          matchesDuration &&
          matchesStatus &&
          matchesNew
        );
      });
  }, [
    experiences,
    search,
    capacityFilter,
    leadTypeFilter,
    deliveryMethodFilter,
    durationFilter,
    statusFilter,
    newOnly,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / DEFAULT_PAGE_SIZE)
  );
  const paginated = filtered.slice(
    (page - 1) * DEFAULT_PAGE_SIZE,
    page * DEFAULT_PAGE_SIZE
  );

  const selectedExperience =
    experiences.find(experience => experience.id === selectedId) ?? null;
  const viewedExperience =
    experiences.find(experience => experience.id === viewId) ?? null;
  const showFormModal = isCreating || selectedExperience !== null;
  const hasActiveFilters =
    search.trim().length > 0 ||
    capacityFilter !== 'all' ||
    leadTypeFilter !== 'all' ||
    deliveryMethodFilter !== 'all' ||
    durationFilter !== 'all' ||
    statusFilter !== 'all' ||
    newOnly;

  function setSelection(id: number | null) {
    setSelectedId(id);
    if (id !== null) {
      router.replace(`/admin/experiences?id=${id}`, {
        scroll: false,
      });
    } else {
      router.replace('/admin/experiences', { scroll: false });
    }
  }

  function handleCreate() {
    setSelection(null);
    setIsCreating(true);
  }

  function handleCloseForm() {
    setIsCreating(false);
    setSelection(null);
  }

  function handleSuccess() {
    router.refresh();
    setIsCreating(false);
    setSelection(null);
  }

  function handleDelete(id: number, title: string) {
    if (
      !window.confirm(
        `Delete this experience?\n\n"${title}"\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        await deleteExperienceAction(id);
        if (selectedId === id) setSelection(null);
        if (viewId === id) setViewId(null);
        setIsCreating(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete experience. Please try again.';
        alert(message);
      }
    });
  }

  const panelAction: (
    prevState: ExperienceFormState,
    formData: FormData
  ) => Promise<ExperienceFormState> =
    selectedId !== null
      ? updateExperienceAction.bind(null, selectedId)
      : createExperienceAction;

  return (
    <>
      <div className={styles.root}>
        <div className={styles.listSection}>
          <div className={styles.listPanel}>
            <SearchPanel
              title={`Experiences (${filtered.length})`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search experiences, providers, categories, or delivery methods…"
              searchTestId="experience-search"
              actions={
                <Button
                  onClick={handleCreate}
                  variant="primary"
                  size="sm"
                  icon={<span>+</span>}
                  disabled={providers.length === 0 || categories.length === 0}
                >
                  Add
                </Button>
              }
            />

            <div className={styles.filterRow}>
              <select
                value={capacityFilter}
                onChange={event =>
                  setCapacityFilter(event.target.value as CapacityFilter)
                }
                className={styles.filterSelect}
                aria-label="Filter by capacity"
              >
                {CAPACITY_FILTERS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={leadTypeFilter}
                onChange={event => setLeadTypeFilter(event.target.value)}
                className={styles.filterSelect}
                aria-label="Filter by lead type"
              >
                <option value="all">All Lead Types</option>
                {leadTypeOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={deliveryMethodFilter}
                onChange={event => setDeliveryMethodFilter(event.target.value)}
                className={styles.filterSelect}
                aria-label="Filter by delivery methods"
              >
                <option value="all">All Delivery Methods</option>
                {deliveryMethodOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={durationFilter}
                onChange={event =>
                  setDurationFilter(event.target.value as DurationFilter)
                }
                className={styles.filterSelect}
                aria-label="Filter by duration"
              >
                {DURATION_FILTERS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={event =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className={styles.filterSelect}
                aria-label="Filter by experience status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>

              <label className={styles.filterCheckbox}>
                <input
                  type="checkbox"
                  checked={newOnly}
                  onChange={event => setNewOnly(event.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>New This Week</span>
              </label>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setCapacityFilter('all');
                    setLeadTypeFilter('all');
                    setDeliveryMethodFilter('all');
                    setDurationFilter('all');
                    setStatusFilter('all');
                    setNewOnly(false);
                  }}
                  className="shrink-0"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>

            <div className={styles.listBody}>
              {filtered.length === 0 ? (
                <AdminEmptyState
                  emoji="🧩"
                  message={
                    hasActiveFilters
                      ? 'No experiences match your search.'
                      : 'No experiences yet.'
                  }
                  testId="experience-empty"
                />
              ) : (
                <div className={styles.cardsGrid}>
                  {paginated.map(experience => (
                    <ExperienceCard
                      key={experience.id}
                      experience={experience}
                      isEditingSelected={
                        experience.id === selectedId && !isCreating
                      }
                      onSelect={() => {
                        setSelection(experience.id);
                        setIsCreating(false);
                      }}
                      onView={() => setViewId(experience.id)}
                      onDelete={() =>
                        handleDelete(experience.id, experience.experienceTitle)
                      }
                    />
                  ))}
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

      <ExperienceForm
        isOpen={showFormModal}
        onClose={handleCloseForm}
        action={panelAction}
        isEdit={!isCreating}
        initial={selectedExperience}
        providers={providers}
        categories={categories}
        dimensions={dimensions}
        onSuccess={handleSuccess}
      />

      <ExperienceView
        isOpen={viewId !== null}
        experience={viewedExperience}
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
