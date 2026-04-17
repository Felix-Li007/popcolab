import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import {
  getUserRequestsPage,
  type UserRequestStatusFilter,
} from '@/services/request-service';
import { getQuestions } from '@/services/question-service';
import { getUserTeams } from '@/services/user-team-service';
import { getRequestAttendees } from '@/services/request-attendee-service';
import { FORM_NAME } from '@/types/question-type';
import RequestsContent from '@/components/requests/requests-content';
import type { RequestAttendeesSummary } from '@/services/request-attendee-service';

type SearchParamsInput = {
  status?: string;
  user_email?: string;
  created_from?: string;
  created_to?: string;
  page?: string;
};

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

function parseStatus(value: string | undefined): UserRequestStatusFilter {
  if (
    value === 'OPENED' ||
    value === 'PENDING' ||
    value === 'MATCHED' ||
    value === 'CLOSED'
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

export default async function RequestsPage({ searchParams }: Readonly<Props>) {
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
    userEmail: resolvedSearchParams.user_email?.trim() ?? '',
    createdFrom: parseDateParam(resolvedSearchParams.created_from),
    createdTo: parseDateParam(resolvedSearchParams.created_to),
    page: parsePositiveInt(resolvedSearchParams.page) ?? 1,
    pageSize: 8,
  };

  const [pageData, leaderQuestions, userTeams] = await Promise.all([
    getUserRequestsPage(userId, query),
    getQuestions(FORM_NAME.REQUEST),
    getUserTeams(userId),
  ]);

  const attendeeSummaries = await Promise.all(
    pageData.items.map(r => getRequestAttendees(r.id))
  );

  const attendeeMap: Record<number, RequestAttendeesSummary> = {};
  pageData.items.forEach((r, i) => {
    attendeeMap[r.id] = attendeeSummaries[i];
  });

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <RequestsContent
            pageData={pageData}
            query={query}
            leaderQuestions={leaderQuestions}
            userTeams={userTeams}
            attendeeMap={attendeeMap}
          />
        </div>
      </div>
    </div>
  );
}
