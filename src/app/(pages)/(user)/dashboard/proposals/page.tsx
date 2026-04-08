import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import { getUserProposals } from '@/services/user-proposal-service';
import UserProposalsContent from '@/components/proposals/user-proposals-content';

export default async function ProposalsPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const proposals = await getUserProposals(userId);

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <UserProposalsContent proposals={proposals} />
        </div>
      </div>
    </div>
  );
}
