import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAuthContext } from '@/services/clerk-service';

export default async function DashboardPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const firstName = authContext.user?.firstName?.trim() ?? '';
  const displayName = firstName || authContext.user?.username || 'there';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is a summary of your account.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/profile"
          className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-deep hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-deep/10 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-teal-deep"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 group-hover:text-teal-deep transition-colors">
                My Profile
              </h2>
              <p className="text-xs text-gray-500">
                Update your name and contact details
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/account"
          className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-deep hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-deep/10 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-teal-deep"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 group-hover:text-teal-deep transition-colors">
                Account Settings
              </h2>
              <p className="text-xs text-gray-500">
                Change your password and security settings
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
