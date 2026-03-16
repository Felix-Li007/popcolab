import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import SearchPanel from '@/components/admin/common/search-panel';
import TeamClient from '@/components/admin/user/team-client';
import PaginationBar from '@/components/shared/pagination-bar';
import type { AdminTeamsPageData } from '@/types/team-type';
import styles from '@/styles/admin/users/team-content.module.css';

type Props = {
  pageData: AdminTeamsPageData;
};

function buildTeamsHref(params: { search: string; page: number }) {
  const searchParams = new URLSearchParams();
  const normalizedSearch = params.search.trim();

  if (normalizedSearch.length > 0) {
    searchParams.set('q', normalizedSearch);
  }
  if (params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  const query = searchParams.toString();
  return query.length > 0
    ? `/admin/users/teams?${query}`
    : '/admin/users/teams';
}

export default function TeamContent({ pageData }: Props) {
  const prevHref =
    pageData.currentPage > 1
      ? buildTeamsHref({
          search: pageData.search,
          page: pageData.currentPage - 1,
        })
      : undefined;
  const nextHref =
    pageData.currentPage < pageData.totalPages
      ? buildTeamsHref({
          search: pageData.search,
          page: pageData.currentPage + 1,
        })
      : undefined;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.panel}>
          <SearchPanel
            mode="submit"
            title={`Teams (${pageData.totalItems})`}
            formAction="/admin/users/teams"
            method="GET"
            defaultSearchValue={pageData.search}
            searchPlaceholder="Search by team name or owner email..."
            searchTestId="team-search"
            clearHref={
              pageData.search.trim().length > 0
                ? buildTeamsHref({ search: '', page: 1 })
                : undefined
            }
          />

          <div className={styles.listArea}>
            {pageData.items.length === 0 ? (
              <AdminEmptyState
                emoji=""
                message="No teams found"
                testId="team-empty"
              />
            ) : (
              <TeamClient teams={pageData.items} />
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
