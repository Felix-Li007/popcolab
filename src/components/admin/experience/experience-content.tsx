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
import type { Experience, ExperienceFormState } from '@/types/experience-type';
import { Button } from '@/ui';
import styles from '@/styles/admin/experiences/experience-content.module.css';

type Props = {
  initialData: Experience[];
  providers: Provider[];
  categories: ExperienceCategory[];
  dimensions: Dimension[];
};

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
  }, [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...experiences]
      .sort((a, b) => {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (aUpdated !== bUpdated) return bUpdated - aUpdated;
        return b.id - a.id;
      })
      .filter(experience => {
        if (!query) return true;

        return [
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
      });
  }, [experiences, search]);

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

            <div className={styles.listBody}>
              {filtered.length === 0 ? (
                <AdminEmptyState
                  emoji="🧩"
                  message={
                    search
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
