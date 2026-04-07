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
          <section className="dashboard-glass-panel px-6 py-5">
            <p className="dashboard-section-eyebrow">Teams workspace</p>
            <h1 className="dashboard-section-title mt-2">Teams</h1>
            <p className="mt-2 text-sm text-gray-500">
              Teams you own or belong to, and any pending invitations.
            </p>
          </section>
          <div className="dashboard-glass-panel p-5 sm:p-6">
            <TeamsContent teams={teams} pendingInvites={pendingInvites} />
          </div>
        </div>
      </div>
    </div>
  );
}
