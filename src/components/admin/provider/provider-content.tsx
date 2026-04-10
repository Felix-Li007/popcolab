'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchPanel from '@/components/admin/common/search-panel';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import PaginationBar from '@/components/shared/pagination-bar';
import ProviderCard from '@/components/admin/provider/provider-card';
import ProviderForm from '@/components/admin/provider/provider-form';
import ProviderView from '@/components/admin/provider/provider-view';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import {
  createProviderAction,
  deleteProviderAction,
  updateProviderAction,
} from '@/actions/provider-actions';
import type { Provider, ProviderFormState } from '@/types/provider-type';
import { Button } from '@/ui';
import styles from '@/styles/admin/experiences/provider-content.module.css';

type Props = {
  initialData: Provider[];
};

export default function ProviderContent({ initialData }: Readonly<Props>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDeleteTransition] = useTransition();
  const [providers, setProviders] = useState<Provider[]>(initialData);
  const [search, setSearch] = useState('');
  const idParam = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);
  const isValidSelectedId = idParam !== null && /^\d+$/.test(idParam);

  useEffect(() => {
    setProviders(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!isValidSelectedId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(Number(idParam ?? 0));
    setIsCreating(false);
  }, [idParam, isValidSelectedId]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...providers]
      .sort((a, b) => {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (aUpdated !== bUpdated) return bUpdated - aUpdated;
        return (b.id ?? 0) - (a.id ?? 0);
      })
      .filter(provider => {
        if (!query) return true;

        return [
          provider.providerLabel,
          provider.providerType,
          provider.providerNotes ?? '',
          provider.pricingNotes ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [providers, search]);

  const providerTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(providers.map(provider => provider.providerType))
      ).sort((a, b) => a.localeCompare(b)),
    [providers]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / DEFAULT_PAGE_SIZE)
  );
  const paginated = filtered.slice(
    (page - 1) * DEFAULT_PAGE_SIZE,
    page * DEFAULT_PAGE_SIZE
  );

  const selectedProvider =
    providers.find(provider => provider.id === selectedId) ?? null;
  const viewedProvider =
    providers.find(provider => provider.id === viewId) ?? null;
  const showFormModal = isCreating || selectedProvider !== null;

  function setSelection(id: number | null) {
    setSelectedId(id);
    if (id === null) {
      router.replace('/admin/experiences/providers', { scroll: false });
      return;
    }

    router.replace(`/admin/experiences/providers?id=${id}`, {
      scroll: false,
    });
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

  function handleDelete(id: number, providerLabel: string) {
    const shouldDelete = globalThis.confirm(
      `Delete this provider?\n\n"${providerLabel}"\n\nLinked experiences must be reassigned first.`
    );

    if (!shouldDelete) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        await deleteProviderAction(id);
        if (selectedId === id) setSelection(null);
        if (viewId === id) setViewId(null);
        setIsCreating(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete provider. Please try again.';
        alert(message);
      }
    });
  }

  let panelAction: (
    prevState: ProviderFormState,
    formData: FormData
  ) => Promise<ProviderFormState> = createProviderAction;

  if (selectedId !== null) {
    panelAction = updateProviderAction.bind(null, selectedId);
  }

  return (
    <>
      <div className={styles.root}>
        <div className={styles.listSection}>
          <div className={styles.listPanel}>
            <SearchPanel
              title={`Providers (${filtered.length})`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search providers, types, or notes…"
              searchTestId="provider-search"
              rootClassName={styles.searchRoot}
              titleClassName={styles.searchTitle}
              searchInputClassName={styles.searchInput}
              actions={
                <Button
                  onClick={handleCreate}
                  variant="primary"
                  size="sm"
                  icon={<span>+</span>}
                  className="!h-9 !min-w-0 !px-4 border border-white/20 bg-[linear-gradient(135deg,#ff4fa6_0%,#ef476f_55%,#ff7e5f_100%)] shadow-[0_16px_28px_rgba(239,71,111,0.24),inset_0_1px_0_rgba(255,255,255,0.2)]"
                >
                  Add
                </Button>
              }
            />

            <div className={styles.listBody}>
              {filtered.length === 0 ? (
                <AdminEmptyState
                  emoji="🏷️"
                  message={
                    search
                      ? 'No providers match your search.'
                      : 'No providers yet.'
                  }
                  testId="provider-empty"
                />
              ) : (
                <div className={styles.cardsGrid}>
                  {paginated.map(provider => {
                    if (!provider.id) return null;

                    return (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        isEditingSelected={
                          provider.id === selectedId && !isCreating
                        }
                        onSelect={() => {
                          setSelection(provider.id ?? null);
                          setIsCreating(false);
                        }}
                        onView={() => setViewId(provider.id ?? null)}
                        onDelete={() =>
                          handleDelete(provider.id ?? 0, provider.providerLabel)
                        }
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
      </div>

      <ProviderForm
        isOpen={showFormModal}
        onClose={handleCloseForm}
        action={panelAction}
        isEdit={!isCreating}
        initial={selectedProvider}
        providerTypeOptions={providerTypeOptions}
        onSuccess={handleSuccess}
      />

      <ProviderView
        isOpen={viewId !== null}
        provider={viewedProvider}
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
