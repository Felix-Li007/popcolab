'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Button } from '@/ui';
import SearchPanel from '@/components/admin/common/search-panel';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import PaginationBar from '@/components/shared/pagination-bar';
import IntakeCard from '@/components/admin/question/intake-card';
import IntakeFormPanel from '@/components/admin/question/intake-edit';
import IntakeView from '@/components/admin/question/intake-view';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import {
  createIntakeFormAction,
  updateIntakeFormAction,
  deleteIntakeFormAction,
} from '@/actions/intake-form-actions';
import type {
  IntakeDimensionOption,
  IntakeForm,
  IntakeFormStatus,
  IntakeQuestionOption,
} from '@/types/intake-form-type';
import styles from '@/styles/intake-content.module.css';

type Props = {
  initialData: IntakeForm[];
  availableQuestions: IntakeQuestionOption[];
  availableDimensions: IntakeDimensionOption[];
};

type StatusFilter = 'all' | IntakeFormStatus;

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 1 },
  { label: 'Draft', value: 0 },
];

export default function IntakeContent({
  initialData,
  availableQuestions,
  availableDimensions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();

  const [forms, setForms] = useState<IntakeForm[]>(initialData);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const idParam = searchParams.get('id');

  useEffect(() => {
    setForms(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!idParam || !/^\d+$/.test(idParam)) {
      setSelectedId(null);
      return;
    }

    setSelectedId(Number(idParam));
  }, [idParam]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const counts = useMemo(
    () => ({
      all: forms.length,
      active: forms.filter(form => form.status === 1).length,
      draft: forms.filter(form => form.status === 0).length,
    }),
    [forms]
  );

  const filtered = useMemo(
    () =>
      forms.filter(form => {
        const matchFilter = filter === 'all' || form.status === filter;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          form.name.toLowerCase().includes(query) ||
          form.description.toLowerCase().includes(query) ||
          form.formType.toLowerCase().includes(query);

        return matchFilter && (!query || matchesSearch);
      }),
    [forms, filter, search]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / DEFAULT_PAGE_SIZE)
  );
  const paginated = filtered.slice(
    (page - 1) * DEFAULT_PAGE_SIZE,
    page * DEFAULT_PAGE_SIZE
  );
  const selectedForm = forms.find(form => form.id === editingId);
  const viewedForm = forms.find(form => form.id === viewId) ?? null;
  const showFormModal = isCreating || editingId !== null;

  function setSelection(id: number | null) {
    setSelectedId(id);
    if (id !== null) {
      router.replace(`/admin/questions/forms?id=${id}`, { scroll: false });
    } else {
      router.replace('/admin/questions/forms', { scroll: false });
    }
  }

  function openCreate() {
    setSelection(null);
    setIsCreating(true);
    setEditingId(null);
  }

  function openEdit(id: number) {
    setSelection(id);
    setEditingId(id);
    setIsCreating(false);
  }

  function closeForm() {
    setIsCreating(false);
    setEditingId(null);
  }

  function openView(id: number) {
    setSelection(id);
    setViewId(id);
  }

  function handleSuccess() {
    closeForm();
    router.refresh();
  }

  function handleDelete(id: number, name: string) {
    if (
      !window.confirm(
        `Delete this intake form?\n\n"${name}"\n\nThis cannot be undone.`
      )
    )
      return;

    startDeleteTransition(async () => {
      try {
        await deleteIntakeFormAction(id);
        if (selectedId === id) setSelection(null);
        if (editingId === id) closeForm();
        if (viewId === id) setViewId(null);
        router.refresh();
      } catch {
        alert('Failed to delete intake form. Please try again.');
      }
    });
  }

  const panelAction =
    editingId !== null
      ? updateIntakeFormAction.bind(null, editingId)
      : createIntakeFormAction;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        {/* <div className={styles.contentRow}> */}
        <div className={styles.panel}>
          <SearchPanel
            title={`Forms (${filtered.length})`}
            searchPlaceholder="Search intake forms..."
            searchValue={search}
            onSearchChange={setSearch}
            searchTestId="intake-form-search"
            actions={
              <Button
                onClick={openCreate}
                variant="primary"
                size="sm"
                icon={<span>+</span>}
              >
                New
              </Button>
            }
          />

          <div className={styles.filterBar}>
            {STATUS_FILTERS.map(statusFilter => (
              <Button
                key={statusFilter.value}
                onClick={() => setFilter(statusFilter.value)}
                variant="tab"
                size="xs"
                isActive={filter === statusFilter.value}
                className={styles.filterButton}
              >
                {statusFilter.label}
                <Badge
                  variant="default"
                  size="xs"
                  bgColor={
                    filter === statusFilter.value
                      ? 'bg-white/20'
                      : 'bg-gray-100'
                  }
                  textColor={
                    filter === statusFilter.value
                      ? 'text-white'
                      : 'text-gray-500'
                  }
                >
                  {statusFilter.value === 'all'
                    ? counts.all
                    : statusFilter.value === 1
                      ? counts.active
                      : counts.draft}
                </Badge>
              </Button>
            ))}
          </div>

          <div className={styles.listBody}>
            {filtered.length === 0 ? (
              <AdminEmptyState
                emoji="🧾"
                message={
                  search
                    ? 'No intake forms match your search.'
                    : 'No intake forms yet.'
                }
                testId="intake-form-empty"
              />
            ) : (
              <div className={styles.cardGrid}>
                {paginated.map((form, index) => {
                  const globalIndex =
                    (page - 1) * DEFAULT_PAGE_SIZE + index + 1;
                  const formId = form.id;
                  if (!formId) return null;

                  return (
                    <IntakeCard
                      key={formId}
                      form={form}
                      formIndex={globalIndex}
                      isSelected={formId === selectedId}
                      onSelect={setSelection}
                      availableDimensions={availableDimensions}
                      onView={openView}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  );
                })}
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

      {showFormModal ? (
        <IntakeFormPanel
          key={isCreating ? 'create' : `edit-${editingId}`}
          isOpen={showFormModal}
          onClose={closeForm}
          action={panelAction}
          isEdit={!isCreating && editingId !== null}
          initial={isCreating ? undefined : (selectedForm ?? undefined)}
          availableQuestions={availableQuestions}
          availableDimensions={availableDimensions}
          onSuccess={handleSuccess}
          onDelete={
            !isCreating && editingId !== null && selectedForm
              ? () => handleDelete(editingId, selectedForm.name)
              : undefined
          }
        />
      ) : null}

      <IntakeView
        form={viewedForm}
        isOpen={viewId !== null}
        onClose={() => setViewId(null)}
        availableQuestions={availableQuestions}
        availableDimensions={availableDimensions}
      />
    </div>
  );
}
