import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { upsertUserByClerkId } from '@/services/user-sync-service';

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    const email =
      clerkUser.emailAddresses.find(
        e => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ?? '';
    const userName =
      clerkUser.username ??
      clerkUser.firstName ??
      email.split('@')[0] ??
      'user';

    await upsertUserByClerkId(userId, email, userName);
  }

  return <div> </div>;
}
