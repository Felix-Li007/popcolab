'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, useTransition } from 'react';
import {
  addExperienceToProposalAction,
  listProposalExperienceCandidatesPageAction,
  updateAdminProposalAction,
} from '@/actions/proposal-actions';
import { getExperienceByIdAction } from '@/actions/experience-actions';
import type {
  AdminProposalEditableItem,
  ProposalEditState,
} from '@/types/proposal-type';
import type { Experience } from '@/types/experience-type';
import { ExperienceCard } from '@/components/admin/experience/experience-card';
import ExperienceView from '@/components/admin/experience/experience-view';
import ProposalExperience from '@/components/admin/proposal/proposal-experience';
import PaginationBar from '@/components/shared/pagination-bar';
import styles from '@/styles/admin/proposals/proposal-edit.module.css';

type Props = {
  proposal: AdminProposalEditableItem;
};

const INITIAL_STATE: ProposalEditState = {};

function getHeaderStatusStyle(status: AdminProposalEditableItem['status']) {
  switch (status) {
    case 'pending':
      return styles.statusPending;
    case 'approved':
      return styles.statusApproved;
    case 'accepted':
      return styles.statusAccepted;
    case 'rejected':
      return styles.statusRejected;
    default:
      return styles.statusDefault;
  }
}

export default function ProposalEditForm({ proposal }: Readonly<Props>) {
  const action = updateAdminProposalAction.bind(null, proposal.id);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [isSearching, startSearchTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isRationaleDialogOpen, setIsRationaleDialogOpen] = useState(false);
  const [pendingExperienceId, setPendingExperienceId] = useState<number | null>(
    null
  );
  const [pendingExperienceTitle, setPendingExperienceTitle] = useState('');
  const [pendingRationale, setPendingRationale] = useState('');
  const [viewExperienceId, setViewExperienceId] = useState<number | null>(null);
  const [viewExperience, setViewExperience] = useState<Experience | null>(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: number;
      title: string;
      status: 'draft' | 'inactive' | 'active';
      providerLabel: string;
      providerType: string;
      categoryTitle: string;
      popularityIndex: number;
      durationMin: number;
      durationMax: number;
      capacityMax: number;
      leadType: string;
      deliveryMethods: string;
      startingPrice: number | null;
      addingPrice: number | null;
      takeItem: number | null;
      travelFlying: number | null;
      createdAt: Date | null;
    }>
  >([]);
  const pageSize = 6;
  const statusPillStyle = getHeaderStatusStyle(proposal.status);
  const trimmedKeyword = searchKeyword.trim();
  const hasSearchKeyword = trimmedKeyword.length > 0;

  function handleLoadExperienceList(page: number, keyword: string) {
    // Keep candidate loading behind a transition so pagination and searches feel
    // responsive without blocking the rest of the editor.
    startSearchTransition(async () => {
      try {
        const result = await listProposalExperienceCandidatesPageAction(
          proposal.id,
          keyword,
          page,
          pageSize
        );

        setSearchResults(result.items);
        setCurrentPage(result.page);
        setTotalPages(result.totalPages);
        setSearchMessage(
          result.items.length === 0 ? 'No available experiences found.' : ''
        );
      } catch {
        setSearchMessage('Failed to load experiences. Please try again.');
      }
    });
  }

  useEffect(() => {
    handleLoadExperienceList(1, '');
    // proposal.id changes only when editing a different proposal page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadViewExperience() {
      // The details drawer loads lazily so the main proposal form does not pay
      // the cost of fetching every experience card up front.
      if (viewExperienceId === null) {
        setViewExperience(null);
        return;
      }

      try {
        const detail = await getExperienceByIdAction(viewExperienceId);
        if (!cancelled) {
          setViewExperience(detail);
        }
      } catch {
        if (!cancelled) {
          setViewExperience(null);
        }
      }
    }

    loadViewExperience();

    return () => {
      cancelled = true;
    };
  }, [viewExperienceId]);

  function handleSearchExperience() {
    handleLoadExperienceList(1, trimmedKeyword);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }
    handleLoadExperienceList(nextPage, trimmedKeyword);
  }

  function openRationaleDialog(experienceId: number, experienceTitle: string) {
    setPendingExperienceId(experienceId);
    setPendingExperienceTitle(experienceTitle);
    setPendingRationale('');
    setIsRationaleDialogOpen(true);
  }

  function closeRationaleDialog() {
    setIsRationaleDialogOpen(false);
    setPendingExperienceId(null);
    setPendingExperienceTitle('');
    setPendingRationale('');
  }

  function handleConfirmAddExperience() {
    if (pendingExperienceId === null) {
      return;
    }

    const rationale = pendingRationale.trim();
    if (!rationale) {
      setSearchMessage('Please provide rationale for this experience first.');
      return;
    }

    startAddTransition(async () => {
      try {
        const result = await addExperienceToProposalAction(
          proposal.id,
          pendingExperienceId,
          rationale
        );

        if (!result.ok) {
          setSearchMessage(result.message);
          return;
        }

        setSearchMessage(result.message);
        setSearchResults(prev =>
          prev.filter(item => item.id !== pendingExperienceId)
        );
        closeRationaleDialog();
        router.refresh();
      } catch {
        setSearchMessage('Failed to add experience. Please try again.');
      }
    });
  }

  function toExperienceCardModel(item: {
    id: number;
    title: string;
    status: 'draft' | 'inactive' | 'active';
    providerLabel: string;
    providerType: string;
    categoryTitle: string;
    popularityIndex: number;
    durationMin: number;
    durationMax: number;
    capacityMax: number;
    leadType: string;
    deliveryMethods: string;
    startingPrice: number | null;
    addingPrice: number | null;
    takeItem: number | null;
    travelFlying: number | null;
    createdAt: Date | null;
  }): Experience {
    return {
      id: item.id,
      providerId: 0,
      providerLabel: item.providerLabel,
      providerType: item.providerType,
      categoryId: 0,
      categoryTitle: item.categoryTitle,
      experienceTitle: item.title,
      experienceStatus: item.status,
      popularityIndex: item.popularityIndex,
      durationMin: item.durationMin,
      durationMax: item.durationMax,
      capacityMax: item.capacityMax,
      leadType: item.leadType,
      deliveryMethods: item.deliveryMethods,
      pricing: {
        startingPrice: item.startingPrice,
        addingPrice: item.addingPrice,
        startingHour: null,
        pricingModel: null,
        pricingNotes: null,
      },
      takeItem: item.takeItem,
      travelFlying: item.travelFlying,
      createdBy: 0,
      dimensionCount: 0,
      proposalCount: 0,
      calendarCount: 0,
      dimensionValues: [],
      createdAt: item.createdAt ?? undefined,
    };
  }

  return (
    <div className={styles.page}>
      <div className={styles.blobLeft} />
      <div className={styles.blobRight} />

      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Edit Proposal #{proposal.id}</h1>
              <p className={styles.meta}>
                <Link
                  href={`/admin/requests/${proposal.requestId}`}
                  className={styles.requestLink}
                >
                  Request #{proposal.requestId}
                </Link>{' '}
                · {proposal.experiences.length} experiences
              </p>
            </div>
            <div className={styles.headerActions}>
              <Link href="/admin/proposals" className={styles.backToProposals}>
                Back to Proposals
              </Link>
              <span className={`${styles.statusPill} ${statusPillStyle}`}>
                {proposal.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <form action={formAction} className={styles.form}>
          <input type="hidden" name="status" value={proposal.status} />
          <input
            type="hidden"
            name="objectiveAlignment"
            value={proposal.objectiveAlignment}
          />
          <input type="hidden" name="rationale" value={proposal.rationale} />
          <input
            type="hidden"
            name="baseScore"
            value={String(proposal.baseScore)}
          />
          <input
            type="hidden"
            name="riskAdjustment"
            value={String(proposal.riskAdjustment)}
          />

          <div className={styles.layout}>
            <section className={styles.leftSection}>
              <h2 className={styles.sectionTitle}>Current Experiences</h2>
              <ProposalExperience
                proposalId={proposal.id}
                experiences={proposal.experiences}
                title="Current Experiences"
                allowDelete={true}
                plainList={true}
              />
            </section>

            <section className={styles.rightSection}>
              <h2 className={styles.sectionTitle}>Experience List</h2>

              <div className={styles.searchRow}>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={event => setSearchKeyword(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSearchExperience();
                    }
                  }}
                  placeholder="Search by title, provider, category, or delivery method"
                  className={styles.searchInput}
                />
                <button
                  type="button"
                  onClick={handleSearchExperience}
                  disabled={isSearching}
                  className={styles.searchButton}
                >
                  {isSearching ? 'Loading...' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    handleLoadExperienceList(1, '');
                  }}
                  disabled={isSearching || !hasSearchKeyword}
                  className={styles.clearButton}
                >
                  Clear
                </button>
              </div>

              <div className={styles.pageMeta}>
                Showing page {currentPage} of {totalPages}
                {hasSearchKeyword ? ` for "${trimmedKeyword}"` : ''}
              </div>

              {searchMessage ? (
                <p className={styles.searchMessage}>{searchMessage}</p>
              ) : null}

              <div className={styles.resultGrid}>
                {searchResults.map(item => (
                  <ExperienceCard
                    key={item.id}
                    experience={toExperienceCardModel(item)}
                    mode="picker"
                    isAddDisabled={isAdding}
                    onView={() => setViewExperienceId(item.id)}
                    onAdd={() => openRationaleDialog(item.id, item.title)}
                  />
                ))}
              </div>

              <div className={styles.paginationWrap}>
                <PaginationBar
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </section>
          </div>

          {isRationaleDialogOpen ? (
            <div className={styles.dialogOverlay}>
              <div className={styles.dialogPanel}>
                <h3 className={styles.dialogTitle}>Add Experience</h3>
                <p className={styles.dialogSubtitle}>
                  {pendingExperienceTitle}
                </p>

                <textarea
                  value={pendingRationale}
                  onChange={event => setPendingRationale(event.target.value)}
                  rows={4}
                  className={styles.dialogTextarea}
                  placeholder="Please input rationale"
                />

                <div className={styles.dialogActions}>
                  <button
                    type="button"
                    onClick={closeRationaleDialog}
                    disabled={isAdding}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAddExperience}
                    disabled={isAdding}
                    className={styles.confirmButton}
                  >
                    {isAdding ? 'Adding...' : 'Confirm Add'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <ExperienceView
            isOpen={Boolean(viewExperience)}
            experience={viewExperience}
            showEditButton={false}
            onClose={() => {
              setViewExperienceId(null);
              setViewExperience(null);
            }}
          />

          {state.fieldErrors?.objectiveAlignment ? (
            <p className={styles.errorMessage}>
              {state.fieldErrors.objectiveAlignment}
            </p>
          ) : null}

          {state.error ? (
            <p className={styles.errorMessage}>{state.error}</p>
          ) : null}
          {state.success ? (
            <p className={styles.successMessage}>Saved successfully.</p>
          ) : null}

          <div className={styles.footerActions}>
            <Link href="/admin/proposals" className={styles.backButton}>
              Back
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className={styles.saveButton}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
