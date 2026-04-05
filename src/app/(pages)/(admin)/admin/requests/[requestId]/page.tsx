import { notFound } from 'next/navigation';
import RequestDetail from '@/components/admin/request/request-detail';
import { getAdminRequestById } from '@/services/request-service';

type SearchParamsInput = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ requestId: string }>;
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

function getFirstValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeBackHref(value: string | undefined): string {
  const candidate = value?.trim() ?? '';
  if (!candidate.startsWith('/admin/requests')) {
    return '/admin/requests';
  }

  return candidate;
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: Readonly<Props>) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestId = Number.parseInt(resolvedParams.requestId, 10);

  if (!Number.isInteger(requestId) || requestId < 1) {
    notFound();
  }

  const request = await getAdminRequestById(requestId);
  if (!request) {
    notFound();
  }

  const backHref = normalizeBackHref(getFirstValue(resolvedSearchParams.from));

  return <RequestDetail request={request} backHref={backHref} />;
}
