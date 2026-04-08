import { notFound, redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import { getUserProposalById } from '@/services/user-proposal-service';
import UserProposalDetailContent from '@/components/proposals/user-proposal-detail-content';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProposalDetailPage({ params }: Props) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const { id } = await params;
  const proposalId = Number(id);
  if (Number.isNaN(proposalId)) notFound();

  const proposal = await getUserProposalById(proposalId, userId);
  if (!proposal) notFound();

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <UserProposalDetailContent proposal={proposal} />
        </div>
      </div>
    </div>
  );
}
