import TeamContent from '@/components/admin/user/team-content';
import { getAdminTeamsPage } from '@/services/team-service';

const PAGE_SIZE = 6;

type SearchParamsInput = Record<string, string | string[] | undefined>;

function getFirstValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

export default async function TeamsPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getFirstValue(resolvedSearchParams.q)?.trim() ?? '';
  const page = parsePage(getFirstValue(resolvedSearchParams.page));
  const pageData = await getAdminTeamsPage({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  return <TeamContent pageData={pageData} />;
}
