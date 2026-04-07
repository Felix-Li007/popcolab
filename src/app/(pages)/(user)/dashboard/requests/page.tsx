import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import {
  getUserRequests,
  getRequestStats,
} from '@/services/user-request-service';
import { getQuestions } from '@/services/question-service';
import { getUserTeams } from '@/services/user-team-service';
import { FORM_NAME } from '@/types/question-type';
import RequestsContent from '@/components/requests/requests-content';

export default async function RequestsPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const [requests, stats, memberQuestions, userTeams] = await Promise.all([
    getUserRequests(userId),
    getRequestStats(userId),
    getQuestions(FORM_NAME.MEMBER),
    getUserTeams(userId),
  ]);

  return (
    <div className="p-8">
      <RequestsContent
        requests={requests}
        stats={stats}
        memberQuestions={memberQuestions}
        userTeams={userTeams}
      />
    </div>
  );
}
