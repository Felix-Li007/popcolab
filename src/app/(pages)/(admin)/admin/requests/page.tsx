import RequestContent from '../../../../../components/admin/request/request-content';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { toRequestStatus } from '@/constants/request-status';
import { getAdminRequestsPage } from '@/services/request-service';
import type { AdminRequestStatusFilter } from '@/types/request-type';

type SearchParamsInput = Record<string, string | string[] | undefined>;

function getFirstValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseStatus(value: string | undefined): AdminRequestStatusFilter {
  if (!value) return 'all';
  return toRequestStatus(value) ?? 'all';
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function parseUserId(value: string | undefined): number | null {
  if (!value) return null;
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1) return null;
  return numericValue;
}

function parseDateString(value: string | undefined): string {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? '' : value;
}

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

export default async function RequestsPage({ searchParams }: Readonly<Props>) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getFirstValue(resolvedSearchParams.q)?.trim() ?? '';
  const userEmail =
    getFirstValue(resolvedSearchParams.user_email)?.trim() ?? '';
  const companyName =
    getFirstValue(resolvedSearchParams.company_name)?.trim() ?? '';
  const status = parseStatus(getFirstValue(resolvedSearchParams.status));
  const userId = parseUserId(getFirstValue(resolvedSearchParams.user_id));
  const createdFrom = parseDateString(
    getFirstValue(resolvedSearchParams.created_from)
  );
  const createdTo = parseDateString(
    getFirstValue(resolvedSearchParams.created_to)
  );
  const page = parsePage(getFirstValue(resolvedSearchParams.page));
  const pageData = await getAdminRequestsPage({
    search,
    userEmail,
    companyName,
    status,
    userId,
    createdFrom,
    createdTo,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <RequestContent
      pageData={pageData}
      query={{
        search,
        userEmail,
        companyName,
        status,
        userId,
        createdFrom,
        createdTo,
      }}
    />
  );
}
