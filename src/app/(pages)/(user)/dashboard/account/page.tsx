import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import AccountSettings from '@/components/dashboard/account-settings';

export default async function AccountPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your email and password.
        </p>
      </div>
      <AccountSettings />
    </div>
  );
}
