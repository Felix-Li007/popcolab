import UserContent from '@/components/admin/user/user-content';
import { isUserStatus } from '@/constants/user-status';
import { getUsersPage } from '@/services/user-service';
import type { AdminUsersStatusFilter } from '@/types/user-type';

const PAGE_SIZE = 10;

type SearchParamsInput = Record<string, string | string[] | undefined>;

function getFirstValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseStatus(value: string | undefined): AdminUsersStatusFilter {
  if (!value) return 'all';
  const normalized = value.toLowerCase();
  return isUserStatus(normalized) ? normalized : 'all';
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

export default async function UsersPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getFirstValue(resolvedSearchParams.q)?.trim() ?? '';
  const status = parseStatus(getFirstValue(resolvedSearchParams.status));
  const page = parsePage(getFirstValue(resolvedSearchParams.page));
  const pageData = await getUsersPage({
    search,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  return <UserContent pageData={pageData} query={{ search, status }} />;
}
