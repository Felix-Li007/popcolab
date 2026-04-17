'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { generateProposalForRequestAction } from '@/actions/proposal-actions';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import Select from '@/ui/Select';
import DatePicker from '@/components/shared/date-picker';
import PaginationBar from '@/components/shared/pagination-bar';
import RequestUsers from '@/components/admin/request/request-users';
import { REQUEST_STATUS_OPTIONS } from '@/constants/request-status';
import { REQUEST_STATUS } from '@/constants/request-status';
import { USER_STATUS } from '@/constants/user-status';
import type {
  AdminRequestListItem,
  AdminRequestUserSummary,
  AdminRequestsPageData,
  AdminRequestStatusFilter,
} from '@/types/request-type';
import type { AdminUserListItem } from '@/types/user-type';
import UserViewModal from '@/components/admin/user/user-view';
import { Badge, Search } from '@/ui';
import styles from '@/styles/admin/requests/request-content.module.css';

type Props = {
  pageData: AdminRequestsPageData;
  query: {
    search: string;
    userEmail: string;
    companyName: string;
    status: AdminRequestStatusFilter;
    userId: number | null;
    createdFrom: string;
    createdTo: string;
  };
};

function buildRequestsHref(params: {
  search: string;
  userEmail: string;
  companyName: string;
  status: AdminRequestStatusFilter;
  userId: number | null;
  createdFrom: string;
  createdTo: string;
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
  if (params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.userId !== null) {
    searchParams.set('user_id', String(params.userId));
  }
  if (params.createdFrom) {
    searchParams.set('created_from', params.createdFrom);
  }
  if (params.createdTo) {
    searchParams.set('created_to', params.createdTo);
  }
  if (params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/requests?${queryString}` : '/admin/requests';
}

function toPickerDateTime(value: string, isEndOfDay: boolean): string {
  if (!value) return '';

  return `${value}T${isEndOfDay ? '23:59' : '00:00'}`;
}

function toDateParam(value: string): string {
  if (!value) return '';

  const [datePart = ''] = value.split('T');
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '';
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function formatBudget(min: number | null, max: number | null): string {
  if (min === null && max === null) return '-';
  if (min !== null && max !== null) {
    return `${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  return (min ?? max ?? 0).toLocaleString();
}

function mapRequestUserToAdminUserItem(
  user: AdminRequestUserSummary
): AdminUserListItem {
  return {
    id: user.id,
    email: user.email,
    userName: user.userName ?? user.email.split('@')[0] ?? 'user',
    avatarImage: null,
    status: USER_STATUS.ACTIVE,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: null,
    preferredContact: null,
    shortBio: null,
    consentGiven: null,
    privacyNotes: null,
    companyName: user.companyName,
    departmentName: user.departmentName,
    roleTitle: user.roleTitle,
    workMode: null,
    companySize: null,
    companyWebsite: null,
    teamCount: 0,
    teamNames: [],
    requestCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function RequestContent({ pageData, query }: Readonly<Props>) {
  const [isGenerating, startGenerateTransition] = useTransition();
  const [invitedUsersRequest, setInvitedUsersRequest] =
    useState<AdminRequestListItem | null>(null);
  const [viewUser, setViewUser] = useState<AdminUserListItem | null>(null);
  const [createdFromValue, setCreatedFromValue] = useState(() =>
    toPickerDateTime(query.createdFrom, false)
  );
  const [createdToValue, setCreatedToValue] = useState(() =>
    toPickerDateTime(query.createdTo, true)
  );

  const createdFromDateParam = toDateParam(createdFromValue);
  const createdToDateParam = toDateParam(createdToValue);
  const currentListHref = buildRequestsHref({
    search: query.search,
    userEmail: query.userEmail,
    companyName: query.companyName,
    status: query.status,
    userId: query.userId,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
    page: pageData.currentPage,
  });

  const prevHref =
    pageData.currentPage > 1
      ? buildRequestsHref({
          search: query.search,
          userEmail: query.userEmail,
          companyName: query.companyName,
          status: query.status,
          userId: query.userId,
          createdFrom: query.createdFrom,
          createdTo: query.createdTo,
          page: pageData.currentPage - 1,
        })
      : undefined;

  const nextHref =
    pageData.currentPage < pageData.totalPages
      ? buildRequestsHref({
          search: query.search,
          userEmail: query.userEmail,
          companyName: query.companyName,
          status: query.status,
          userId: query.userId,
          createdFrom: query.createdFrom,
          createdTo: query.createdTo,
          page: pageData.currentPage + 1,
        })
      : undefined;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.heading}>Requests ({pageData.totalItems})</div>

          <div className={styles.filterBar}>
            <form
              action="/admin/requests"
              method="GET"
              className={styles.filterForm}
            >
              <div className={styles.standaloneInputShell}>
                <input
                  type="email"
                  name="user_email"
                  defaultValue={query.userEmail}
                  placeholder="User Email"
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.standaloneInputShell}>
                <input
                  type="text"
                  name="company_name"
                  defaultValue={query.companyName}
                  placeholder="Company Name"
                  className={styles.filterInput}
                />
              </div>
              <Select
                name="status"
                defaultValue={query.status}
                ariaLabel="Request status"
                options={[
                  { value: 'all', label: 'All Status' },
                  ...REQUEST_STATUS_OPTIONS.map(option => ({
                    value: option.value,
                    label: option.label,
                  })),
                ]}
              />
              <DatePicker
                id="request-created-from"
                ariaLabel="Created from"
                value={createdFromValue}
                onChange={setCreatedFromValue}
                placeholder="Created from"
                defaultTime="00:00"
                triggerIcon="calendar"
                inputClassName={styles.filterInput}
              />
              <DatePicker
                id="request-created-to"
                ariaLabel="Created to"
                value={createdToValue}
                onChange={setCreatedToValue}
                placeholder="Created to"
                defaultTime="23:59"
                triggerIcon="calendar"
                inputClassName={styles.filterInput}
              />

              {createdFromDateParam ? (
                <input
                  type="hidden"
                  name="created_from"
                  value={createdFromDateParam}
                />
              ) : null}
              {createdToDateParam ? (
                <input
                  type="hidden"
                  name="created_to"
                  value={createdToDateParam}
                />
              ) : null}

              <div className={styles.keywordField}>
                <label className={styles.srOnlyLabel} htmlFor="request-keyword">
                  Search
                </label>
                <Search
                  id="request-keyword"
                  name="q"
                  defaultValue={query.search}
                  placeholder="Keyword (company name, user name)"
                  data-testid="admin-request-search"
                  wrapperClassName={styles.keywordRow}
                  iconClassName={styles.searchIcon}
                  inputClassName={styles.keywordInput}
                  buttonClassName={styles.searchButton}
                />
              </div>

              <Link
                href={buildRequestsHref({
                  search: '',
                  userEmail: '',
                  companyName: '',
                  status: 'all',
                  userId: null,
                  createdFrom: '',
                  createdTo: '',
                  page: 1,
                })}
                className={styles.filterClearLink}
              >
                Clear Filters
              </Link>
            </form>
          </div>

          <div className={styles.listArea}>
            {pageData.items.length === 0 ? (
              <AdminEmptyState
                emoji="📬"
                message={
                  query.search.trim().length > 0
                    ? 'No requests match your search.'
                    : 'No requests found.'
                }
                testId="admin-request-empty"
              />
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Budget</th>
                      <th>Delivery Method</th>
                      <th>Capacity Max</th>
                      <th>Duration Max</th>
                      <th>Invited Users</th>
                      <th>User</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Proposals</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.items.map(request => {
                      const allInvitedUsersResponded =
                        request.inviteSummary.total > 0 &&
                        request.inviteSummary.pending === 0;
                      // Manual generation is only valid once every invited user
                      // has responded and the request is not already in-flight
                      // or fully closed.
                      const canGenerate =
                        allInvitedUsersResponded &&
                        request.status !== REQUEST_STATUS.PENDING &&
                        request.status !== REQUEST_STATUS.CLOSED;

                      return (
                        <tr key={request.id} data-testid="admin-request-row">
                          <td>
                            <div className={styles.requestCellTitle}>
                              #{request.id}
                            </div>
                          </td>
                          <td>
                            {formatBudget(request.budgetMin, request.budgetMax)}
                          </td>
                          <td>{request.deliveryMethod || '-'}</td>
                          <td>{request.capacityMax}</td>
                          <td>{request.durationMax ?? '-'}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.countLinkButton}
                              onClick={() => setInvitedUsersRequest(request)}
                            >
                              {request.inviteSummary.total}
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.userProfileButton}
                              onClick={() =>
                                setViewUser(
                                  mapRequestUserToAdminUserItem(request.user)
                                )
                              }
                            >
                              {request.user.displayName}
                            </button>
                            <div className={styles.requestCellSub}>
                              {request.user.email}
                            </div>
                          </td>
                          <td>
                            {(() => {
                              const statusIdx =
                                REQUEST_STATUS_OPTIONS.findIndex(
                                  opt => opt.value === request.status
                                );
                              return (
                                <div className={styles.statusBadgeColumn}>
                                  {(() => {
                                    const statusArr =
                                      REQUEST_STATUS_OPTIONS.slice(statusIdx);
                                    return statusArr.map((opt, idx, arr) => {
                                      let variant:
                                        | 'secondary'
                                        | 'warning'
                                        | 'success'
                                        | 'danger' = 'secondary';
                                      if (opt.value === REQUEST_STATUS.OPENED)
                                        variant = 'secondary';
                                      else if (
                                        opt.value === REQUEST_STATUS.PENDING
                                      )
                                        variant = 'warning';
                                      else if (
                                        opt.value === REQUEST_STATUS.MATCHED
                                      )
                                        variant = 'success';
                                      else if (
                                        opt.value === REQUEST_STATUS.CLOSED
                                      )
                                        variant = 'danger';
                                      // Add extra class to the first future badge for visual grouping
                                      const isCurrent = idx === 0;
                                      const isFirstFuture = idx === 1;
                                      return (
                                        <div
                                          key={opt.value}
                                          className={
                                            styles.statusBadgeWithLine +
                                            (!isCurrent && isFirstFuture
                                              ? ' ' +
                                                styles.statusBadgeFutureGroup
                                              : '')
                                          }
                                        >
                                          <Badge
                                            variant={variant}
                                            size={isCurrent ? 'md' : 'xs'}
                                            className={
                                              isCurrent
                                                ? styles.statusBadgeCurrent
                                                : styles.statusBadgeFuture
                                            }
                                          >
                                            {opt.label}
                                          </Badge>
                                          {idx < arr.length - 1 && (
                                            <div
                                              className={
                                                isCurrent
                                                  ? styles.statusBadgeLineLong
                                                  : styles.statusBadgeLine
                                              }
                                            />
                                          )}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              );
                            })()}
                          </td>
                          <td>{formatDateTime(request.createdAt)}</td>
                          <td>
                            {request.proposalSummary.total > 0 ? (
                              <Link
                                href={`/admin/proposals?request_id=${request.id}`}
                                className={styles.countLinkButton}
                              >
                                {request.proposalSummary.total}
                              </Link>
                            ) : (
                              <span className={styles.requestCellSub}>0</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!canGenerate) return;

                                  startGenerateTransition(async () => {
                                    const result =
                                      await generateProposalForRequestAction(
                                        request.id
                                      );

                                    if (!result.ok || !result.created) {
                                      window.alert(result.message);
                                    }
                                  });
                                }}
                                className={styles.countLinkButton}
                                disabled={isGenerating || !canGenerate}
                                title={
                                  canGenerate
                                    ? 'Generate proposal'
                                    : request.status === REQUEST_STATUS.PENDING
                                      ? 'Pending requests are already being processed.'
                                      : request.status === REQUEST_STATUS.CLOSED
                                        ? 'Closed requests cannot generate proposals.'
                                        : 'Generate is available after all invited users have responded.'
                                }
                              >
                                {isGenerating ? 'Generating...' : 'Generate'}
                              </button>
                              <Link
                                href={{
                                  pathname: `/admin/requests/${request.id}`,
                                  query: { from: currentListHref },
                                }}
                                className={styles.rowViewButton}
                                data-testid="admin-request-view"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
      <RequestUsers
        request={invitedUsersRequest}
        isOpen={invitedUsersRequest !== null}
        onClose={() => setInvitedUsersRequest(null)}
      />

      <UserViewModal
        user={viewUser}
        isOpen={viewUser !== null}
        onClose={() => setViewUser(null)}
      />
    </div>
  );
}
