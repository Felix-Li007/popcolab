'use client';

import { useRouter } from 'next/navigation';
import { SignedIn, UserButton } from '@clerk/nextjs';
import CompanyProfile from '@/components/shared/company-info';
import type { CompanyInfo } from '@/types/company-type';

export default function UserAvatar({
  displayName = 'User',
  roleLabel = 'User',
  initialCompany,
}: {
  displayName?: string;
  roleLabel?: string;
  initialCompany?: CompanyInfo | null;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors group">
      <SignedIn>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-400 via-teal-400 to-emerald-500 ring-1 ring-white/25 flex items-center justify-center text-xs font-bold shadow-sm">
            <UserButton userProfileMode="modal">
              <UserButton.UserProfilePage
                label="Company"
                url="company"
                labelIcon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                    />
                  </svg>
                }
              >
                <CompanyProfile initialCompany={initialCompany} />
              </UserButton.UserProfilePage>

              <UserButton.MenuItems>
                <UserButton.Action
                  label="Dashboard"
                  labelIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                      />
                    </svg>
                  }
                  onClick={() =>
                    router.push(
                      `${process.env.NEXT_PUBLIC_CLERK_ACTION_DASHBOARD_URL}`
                    )
                  }
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border-[1.5px] border-teal-deep" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-white leading-tight">
            {displayName}
          </div>
          <div className="text-badge text-white/50 leading-tight">
            {roleLabel}
          </div>
        </div>
        <svg
          className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors hidden sm:block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </SignedIn>
    </div>
  );
}
