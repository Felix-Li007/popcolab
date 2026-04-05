import ProposalContent from '@/components/admin/proposal/proposal-content';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { getAdminProposalsPage } from '@/services/proposal-service';
import type { AdminProposalStatusFilter } from '@/types/proposal-type';

type SearchParamsInput = Record<string, string | string[] | undefined>;

function getFirstValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseStatus(value: string | undefined): AdminProposalStatusFilter {
  if (!value) return 'all';
  const normalized = value.toLowerCase();
  return normalized === 'pending' ||
    normalized === 'approved' ||
    normalized === 'accepted' ||
    normalized === 'rejected'
    ? normalized
    : 'all';
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function parseRequestId(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

export default async function ProposalsPage({ searchParams }: Readonly<Props>) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getFirstValue(resolvedSearchParams.q)?.trim() ?? '';
  const userEmail =
    getFirstValue(resolvedSearchParams.user_email)?.trim() ?? '';
  const companyName =
    getFirstValue(resolvedSearchParams.company_name)?.trim() ?? '';
  const requestId = parseRequestId(
    getFirstValue(resolvedSearchParams.request_id)
  );
  const status = parseStatus(getFirstValue(resolvedSearchParams.status));
  const page = parsePage(getFirstValue(resolvedSearchParams.page));

  const pageData = await getAdminProposalsPage({
    search,
    userEmail,
    companyName,
    requestId,
    status,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <ProposalContent
      pageData={pageData}
      query={{
        search,
        userEmail,
        companyName,
        requestId,
        status,
      }}
    />
  );
}
