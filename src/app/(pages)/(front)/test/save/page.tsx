import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { savePersonalityKeyAction } from '@/actions/response-actions';

export default async function SaveResultPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const { key } = await searchParams;

  if (key) {
    await savePersonalityKeyAction(key);
  }

  redirect('/dashboard');
}
