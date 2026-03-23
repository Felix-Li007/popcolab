import { BriefcaseBusiness, Sparkles, UserRound } from 'lucide-react';
import type { UserProfileData } from '@/actions/profile-actions';
import type { CompanyInfo } from '@/types/company-type';
import ProfileForm from '@/components/dashboard/profile/profile-form';
import ProfileCard from '@/components/dashboard/profile/profile-card';
import CompanyProfile from '@/components/shared/company-info';
import styles from '@/styles/dashboard/profile-content.module.css';

type ProfileContentProps = {
  profileData: UserProfileData | null;
  companyData?: CompanyInfo | null;
};

export default function ProfileContent({
  profileData,
  companyData,
}: Readonly<ProfileContentProps>) {
  return (
    <div className={styles.pageRoot}>
      <div className={styles.pageContent}>
        <div className={styles.pageInner}>
          <div className={styles.shell}>
            <div className={styles.shellOrbLeft} />
            <div className={styles.shellOrbRight} />
            <div className={styles.shellOrbBottom} />

            <div className={styles.header}>
              <div className={styles.headerGlowLarge} />
              <div className={styles.headerGlowSmall} />
              <h1 className={styles.pageTitle}>My Profile</h1>
            </div>

            {profileData ? (
              <div className={styles.body}>
                <div className={styles.sectionGrid}>
                  <ProfileCard
                    tone="personal"
                    title="Personal Information"
                    titleIcon={<UserRound className="h-4 w-4" />}
                    description="Update your contact details and privacy preferences."
                  >
                    <ProfileForm data={profileData} />
                  </ProfileCard>

                  <ProfileCard
                    tone="work"
                    title="Company Information"
                    titleIcon={<BriefcaseBusiness className="h-4 w-4" />}
                    description="Keep your workplace details up to date for better matching and coordination."
                  >
                    <CompanyProfile initialCompany={companyData} embedded />
                  </ProfileCard>
                </div>
              </div>
            ) : (
              <div className={styles.body}>
                <div className={styles.emptyCard}>
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span>Could not load profile data.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
