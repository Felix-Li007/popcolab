import Link from 'next/link';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import Select from '@/ui/Select';
import PaginationBar from '@/components/shared/pagination-bar';
import ProposalRow from '@/components/admin/proposal/proposal-row';
import type {
  AdminProposalListItem,
  AdminProposalsPageData,
  AdminProposalStatusFilter,
} from '@/types/proposal-type';
import type {
  ProposalRowView,
  RequestGroupView,
} from '@/types/proposal-row.types';
import styles from '@/styles/admin/proposals/proposal-content.module.css';

type Props = {
  pageData: AdminProposalsPageData;
  query: {
    search: string;
    userEmail: string;
    companyName: string;
    requestId: number | null;
    status: AdminProposalStatusFilter;
  };
};

function buildProposalsHref(params: {
  search: string;
  userEmail: string;
  companyName: string;
  requestId: number | null;
  status: AdminProposalStatusFilter;
  page: number;
}): string {
  const searchParams = new URLSearchParams();
  const normalizedSearch = params.search.trim();

  if (normalizedSearch.length > 0) {
    searchParams.set('q', normalizedSearch);
  }
  if (params.userEmail.trim()) {
    searchParams.set('user_email', params.userEmail.trim());
  }
  if (params.companyName.trim()) {
    searchParams.set('company_name', params.companyName.trim());
  }
  if (params.requestId !== null) {
    searchParams.set('request_id', String(params.requestId));
  }
  if (params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/proposals?${queryString}` : '/admin/proposals';
}

function groupItemsByRequest(
  items: AdminProposalListItem[]
): RequestGroupView[] {
  const requestMap = new Map<number, RequestGroupView>();

  for (const item of items) {
    if (!requestMap.has(item.requestId)) {
      requestMap.set(item.requestId, {
        requestId: item.requestId,
        requestStatus: item.requestStatus,
        requestBudgetMin: item.requestBudgetMin,
        requestBudgetMax: item.requestBudgetMax,
        requestExpiredAt: item.requestExpiredAt,
        requestPreferenceCount: item.requestPreferenceCount,
        requestProposalCount: item.requestProposalCount,
        user: item.user,
        proposals: [],
      });
    }

    const requestGroup = requestMap.get(item.requestId);
    if (!requestGroup) continue;

    let proposal = requestGroup.proposals.find(
      candidate => candidate.id === item.id
    );
    if (!proposal) {
      proposal = {
        id: item.id,
        status: item.status,
        objectiveAlignment: item.objectiveAlignment,
        rejectNotes: item.rejectNotes,
        rationale: item.rationale,
        baseScore: item.baseScore,
        riskAdjustment: item.riskAdjustment,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        experiences: [...item.experiences],
      };
      requestGroup.proposals.push(proposal);
      continue;
    }

    for (const experience of item.experiences) {
      if (
        !proposal.experiences.some(
          existingExperience => existingExperience.id === experience.id
        )
      ) {
        proposal.experiences.push(experience);
      }
    }

    if (
      item.experiences.length === 0 &&
      !proposal.experiences.some(
        existingExperience => existingExperience.id === item.experienceId
      )
    ) {
      proposal.experiences.push({
        id: item.experienceId,
        title: item.experienceTitle,
        rationale: item.rationale,
        baseScore: item.baseScore,
        riskAdjustment: item.riskAdjustment,
        durationMin: 0,
        durationMax: 0,
        capacityMax: 0,
        deliveryMethods: '-',
        leadType: '-',
        startingPrice: null,
        addingPrice: null,
        pricingModel: null,
        pricingNotes: null,
        dietaryConsiderations: null,
        nextScheduleDate: null,
        coverImageUrl: null,
      });
    }
  }

  return Array.from(requestMap.values());
}

function flattenProposalRows(
  requestGroups: RequestGroupView[]
): ProposalRowView[] {
  const rows = requestGroups.flatMap(request =>
    request.proposals.map(proposal => ({
      request,
      proposal,
    }))
  );

  return rows.sort((left, right) => {
    const leftTime = new Date(left.proposal.createdAt).getTime();
    const rightTime = new Date(right.proposal.createdAt).getTime();
    return rightTime - leftTime;
  });
}

export default function ProposalContent({ pageData, query }: Readonly<Props>) {
  const requestGroups = groupItemsByRequest(pageData.items);
  const proposalRows = flattenProposalRows(requestGroups);

  const prevHref =
    pageData.currentPage > 1
      ? buildProposalsHref({
          search: query.search,
          userEmail: query.userEmail,
          companyName: query.companyName,
          requestId: query.requestId,
          status: query.status,
          page: pageData.currentPage - 1,
        })
      : undefined;

  const nextHref =
    pageData.currentPage < pageData.totalPages
      ? buildProposalsHref({
          search: query.search,
          userEmail: query.userEmail,
          companyName: query.companyName,
          requestId: query.requestId,
          status: query.status,
          page: pageData.currentPage + 1,
        })
      : undefined;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.heading}>
            Proposals ({pageData.totalItems})
          </div>

          <div className={styles.filterBar}>
            <form
              action="/admin/proposals"
              method="GET"
              className={styles.filterForm}
            >
              <input
                type="text"
                name="request_id"
                defaultValue={query.requestId ?? ''}
                placeholder="Request ID"
                className={styles.filterInput}
              />
              <input
                type="email"
                name="user_email"
                defaultValue={query.userEmail}
                placeholder="User Email"
                className={styles.filterInput}
              />
              <input
                type="text"
                name="company_name"
                defaultValue={query.companyName}
                placeholder="Company Name"
                className={styles.filterInput}
              />
              <Select
                name="status"
                defaultValue={query.status}
                ariaLabel="Proposal status"
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'PENDING' },
                  { value: 'approved', label: 'APPROVED' },
                  { value: 'accepted', label: 'ACCEPTED' },
                  { value: 'rejected', label: 'REJECTED' },
                ]}
              />

              <div className={styles.keywordField}>
                <label
                  className={styles.srOnlyLabel}
                  htmlFor="proposal-keyword"
                >
                  Search
                </label>
                <div className={styles.keywordRow}>
                  <input
                    id="proposal-keyword"
                    type="text"
                    name="q"
                    defaultValue={query.search}
                    placeholder="Keyword (experience, rationale, user, request #)"
                    className={styles.filterInput}
                    data-testid="admin-proposal-search"
                  />
                  <button type="submit" className={styles.searchButton}>
                    Search
                  </button>
                </div>
              </div>

              <Link
                href={buildProposalsHref({
                  search: '',
                  userEmail: '',
                  companyName: '',
                  requestId: null,
                  status: 'all',
                  page: 1,
                })}
                className={styles.filterClearLink}
              >
                Clear Filters
              </Link>
            </form>
          </div>

          <div className={styles.listArea}>
            {proposalRows.length === 0 ? (
              <AdminEmptyState
                emoji="🧩"
                message={
                  query.search.trim().length > 0 ||
                  query.userEmail.trim().length > 0 ||
                  query.companyName.trim().length > 0 ||
                  query.requestId !== null
                    ? 'No proposals match your query.'
                    : 'No proposals found.'
                }
                testId="admin-proposal-empty"
              />
            ) : (
              <div className={styles.proposalRowList}>
                {proposalRows.map(row => (
                  <ProposalRow
                    key={`${row.request.requestId}-${row.proposal.id}`}
                    row={row}
                  />
                ))}
              </div>
            )}
          </div>

          <PaginationBar
            page={pageData.currentPage}
            totalPages={pageData.totalPages}
            prevHref={prevHref}
            nextHref={nextHref}
            variant="circle"
          />
        </div>
      </div>
    </div>
  );
}
