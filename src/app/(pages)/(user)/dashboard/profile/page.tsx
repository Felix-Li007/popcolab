import { getProfileAction } from '@/actions/profile-actions';
import { getCompanyAction } from '@/actions/user-actions';
import ProfileContent from '@/components/dashboard/profile/profile-content';

export default async function ProfilePage() {
  const [profileData, companyData] = await Promise.all([
    getProfileAction(),
    getCompanyAction(),
  ]);

  return <ProfileContent profileData={profileData} companyData={companyData} />;
}
