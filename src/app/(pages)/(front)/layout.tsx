import Header from '@/components/front/page-header';
import PageFooter from '@/components/shared/page-footer';
import { getCompanyAction } from '@/actions/user-actions';
import { getCurrentAuthContext } from '@/services/clerk-service';

export default async function FrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authContext, company] = await Promise.all([
    getCurrentAuthContext(),
    getCompanyAction(),
  ]);
  const firstName = authContext.user?.firstName?.trim() ?? '';
  const lastName = authContext.user?.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const userDisplayName = fullName || authContext.user?.username || 'User';
  const userRoleLabel = authContext.role ?? 'User';
  return (
    <>
      <Header
        userDisplayName={userDisplayName}
        userRoleLabel={userRoleLabel}
        initialCompany={company}
      />
      {children}
      <PageFooter />
    </>
  );
}
