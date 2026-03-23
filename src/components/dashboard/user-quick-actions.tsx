'use client';

import Link from 'next/link';

type Props = {
  hasPersonality: boolean;
};

export default function UserQuickActions({ hasPersonality }: Readonly<Props>) {
  return (
    <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
        Quick Actions
      </p>
      <div className="space-y-2">
        <Link
          href="/test"
          className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-deep hover:bg-teal-100/70 transition-colors"
        >
          <span>🎭</span>
          <span>{hasPersonality ? 'Retake Test' : 'Take Test'}</span>
        </Link>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <span>👤</span>
          <span>Edit Profile</span>
        </Link>
      </div>
    </div>
  );
}
