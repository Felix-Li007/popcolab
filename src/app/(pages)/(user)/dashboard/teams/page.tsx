import { redirect } from 'next/navigation';
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
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const dbUser = await prisma.user.findUnique({
    where: { clerk_id: authContext.user!.id },
    select: { id: true, email: true, user_name: true },
  });
  if (!dbUser) redirect('/sign-in');

  const [teams, pendingInvites] = await Promise.all([
    getUserTeams(dbUser.id),
    getPendingTeamInvites(dbUser.email, dbUser.user_name),
  ]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Teams</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Teams you own or belong to, and any pending invitations.
        </p>
      </div>
      <TeamsContent teams={teams} pendingInvites={pendingInvites} />
    </div>
  );
}
