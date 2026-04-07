'use client';

import Link from 'next/link';

type Props = {
  hasPersonality: boolean;
};

export default function UserQuickActions({ hasPersonality }: Readonly<Props>) {
  return (
    <div className="rounded-[20px] border border-[rgba(1,43,48,0.08)] bg-[rgba(255,255,255,0.80)] p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
        Quick Actions
      </p>
      <div className="space-y-2">
        <Link
          href="/dashboard/test"
          className="flex items-center gap-2 rounded-xl border border-rose-100 bg-fuchsia-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white transition-colors"
        >
          <span>🎭</span>
          <span>{hasPersonality ? 'Retake Test' : 'Take Test'}</span>
        </Link>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-200 hover:bg-white transition-colors"
        >
          <span>👤</span>
          <span>Edit Profile</span>
        </Link>
      </div>
    </div>
  );
}
