'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import SearchPanel from '@/components/admin/common/search-panel';
import UserClient from '@/components/admin/user/user-client';
import PaginationBar from '@/components/shared/pagination-bar';
import { isUserStatus, USER_STATUS_OPTIONS } from '@/constants/user-status';
import type {
  AdminUsersPageData,
  AdminUsersStatusFilter,
} from '@/types/user-type';
import { Badge } from '@/ui';
import styles from '@/styles/admin/users/user-content.module.css';

type Props = {
  pageData: AdminUsersPageData;
  query: {
    search: string;
    status: AdminUsersStatusFilter;
  };
};

function buildUsersHref(params: {
  search: string;
  status: AdminUsersStatusFilter;
  page: number;
}): string {
  const searchParams = new URLSearchParams();
  const normalizedSearch = params.search.trim();

  if (normalizedSearch.length > 0) {
    searchParams.set('q', normalizedSearch);
  }
  if (params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/users?${queryString}` : '/admin/users';
}

export default function UserContent({ pageData, query }: Readonly<Props>) {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const normalizedStatusParam = statusParam?.toLowerCase();
  const activeStatus: AdminUsersStatusFilter =
    normalizedStatusParam && isUserStatus(normalizedStatusParam)
      ? normalizedStatusParam
      : 'all';
  const allCount =
    pageData.statusCounts.active +
    pageData.statusCounts.inactive +
    pageData.statusCounts.blocked;
  const statusTabs: Array<{
    value: AdminUsersStatusFilter;
    label: string;
    count: number;
  }> = [
    { value: 'all', label: 'All', count: allCount },
    ...USER_STATUS_OPTIONS.map(option => ({
      value: option.value,
      label: option.label,
      count: pageData.statusCounts[option.value],
    })),
  ];
  const prevHref =
    pageData.currentPage > 1
      ? buildUsersHref({
          search: query.search,
          status: query.status,
          page: pageData.currentPage - 1,
        })
      : undefined;
  const nextHref =
    pageData.currentPage < pageData.totalPages
      ? buildUsersHref({
          search: query.search,
          status: query.status,
          page: pageData.currentPage + 1,
        })
      : undefined;
  const hiddenFields =
    query.status === 'all'
      ? undefined
      : [{ name: 'status', value: query.status }];

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.panel}>
          <SearchPanel
            mode="submit"
            title={`Users (${pageData.totalItems})`}
            formAction="/admin/users"
            method="GET"
            defaultSearchValue={query.search}
            searchPlaceholder="Search by email, name, company, team..."
            searchTestId="user-search"
            hiddenFields={hiddenFields}
            clearHref={
              query.search.trim().length > 0
                ? buildUsersHref({
                    search: '',
                    status: query.status,
                    page: 1,
                  })
                : undefined
            }
          />

          <div className={styles.tabs}>
            {statusTabs.map(tab => {
              const isActive = activeStatus === tab.value;
              const href = buildUsersHref({
                search: query.search,
                status: tab.value,
                page: 1,
              });

              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`user-status-tab-${tab.value}`}
                >
                  {tab.label}
                  <Badge
                    variant="default"
                    size="xs"
                    className={
                      isActive ? styles.tabBadgeActive : styles.tabBadge
                    }
                  >
                    {tab.count}
                  </Badge>
                </Link>
              );
            })}
          </div>

          <div className={styles.listArea}>
            {pageData.items.length === 0 ? (
              <AdminEmptyState
                emoji="👤"
                message={
                  query.search.trim().length > 0
                    ? 'No users match your search.'
                    : 'No users found.'
                }
                testId="user-empty"
              />
            ) : (
              <UserClient users={pageData.items} />
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
