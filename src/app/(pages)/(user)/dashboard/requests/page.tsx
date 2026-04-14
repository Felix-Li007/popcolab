import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import {
  getUserRequests,
  getRequestStats,
} from '@/services/user-request-service';
import { getQuestions } from '@/services/question-service';
import { getUserTeams } from '@/services/user-team-service';
import { getRequestAttendees } from '@/services/request-attendee-service';
import { FORM_NAME } from '@/types/question-type';
import RequestsContent from '@/components/requests/requests-content';
import type { RequestAttendeesSummary } from '@/services/request-attendee-service';

export default async function RequestsPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const [requests, stats, leaderQuestions, userTeams] = await Promise.all([
    getUserRequests(userId),
    getRequestStats(userId),
    getQuestions(FORM_NAME.REQUEST),
    getUserTeams(userId),
  ]);

  const attendeeSummaries = await Promise.all(
    requests.map(r => getRequestAttendees(r.id))
  );

  const attendeeMap: Record<number, RequestAttendeesSummary> = {};
  requests.forEach((r, i) => {
    attendeeMap[r.id] = attendeeSummaries[i];
  });

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <RequestsContent
            requests={requests}
            stats={stats}
            leaderQuestions={leaderQuestions}
            userTeams={userTeams}
            attendeeMap={attendeeMap}
          />
        </div>
      </div>
    </div>
  );
}
