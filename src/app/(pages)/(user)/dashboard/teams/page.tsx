import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import { prisma } from '@/libs/prisma-client';
import {
  getUserTeams,
  getPendingTeamInvites,
} from '@/services/user-team-service';
import TeamsContent from '@/components/teams/teams-content';

export default async function TeamsPage() {
  const authContext = await getCurrentAuthContext();

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, user_name: true },
  });

  const [teams, pendingInvites] = await Promise.all([
    getUserTeams(userId),
    getPendingTeamInvites(dbUser?.email ?? email, dbUser?.user_name ?? null),
  ]);

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <TeamsContent teams={teams} pendingInvites={pendingInvites} />
        </div>
      </div>
    </div>
  );
}
