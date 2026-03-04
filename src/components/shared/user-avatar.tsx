'use client';

import { SignedIn, UserButton } from '@clerk/nextjs';

export default function UserAvatar({
  displayName = 'User',
  roleLabel = 'User',
}: {
  displayName?: string;
  roleLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors group">
      <SignedIn>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-400 via-teal-400 to-emerald-500 ring-1 ring-white/25 flex items-center justify-center text-xs font-bold shadow-sm">
            <UserButton userProfileMode="modal">
              <UserButton.UserProfilePage
                label="Company"
                url="company"
                labelIcon={<span>🧪</span>}
              >
                <div>Compnay</div>
              </UserButton.UserProfilePage>
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
