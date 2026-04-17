import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import {
  getUserProposalsPage,
  type UserProposalStatusFilter,
} from '@/services/proposal-service';
import UserProposalsContent from '@/components/proposals/user-proposals-content';

type SearchParamsInput = {
  status?: string;
  request_id?: string;
  created_from?: string;
  created_to?: string;
  page?: string;
};

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

function parseStatus(value: string | undefined): UserProposalStatusFilter {
  if (
    value === 'PENDING' ||
    value === 'APPROVED' ||
    value === 'ACCEPTED' ||
    value === 'REJECTED'
  ) {
    return value;
  }

  return 'all';
}

function parseDateParam(value: string | undefined): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function ProposalsPage({ searchParams }: Readonly<Props>) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = {
    status: parseStatus(resolvedSearchParams.status),
    requestId: parsePositiveInt(resolvedSearchParams.request_id),
    createdFrom: parseDateParam(resolvedSearchParams.created_from),
    createdTo: parseDateParam(resolvedSearchParams.created_to),
    page: parsePositiveInt(resolvedSearchParams.page) ?? 1,
    pageSize: 8,
  };
  const pageData = await getUserProposalsPage(userId, query);

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <UserProposalsContent pageData={pageData} query={query} />
        </div>
      </div>
    </div>
  );
}
