import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getProfileAction } from '@/actions/profile-actions';
import ProfileForm from '@/components/dashboard/profile-form';

export default async function ProfilePage() {
  const [authContext, profileData] = await Promise.all([
    getCurrentAuthContext(),
    getProfileAction(),
  ]);

  if (!authContext.isAuthenticated) redirect('/sign-in');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your personal details.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {profileData ? (
          <ProfileForm data={profileData} />
        ) : (
          <p className="text-sm text-gray-500">Could not load profile data.</p>
        )}
      </div>
    </div>
  );
}
