'use client';

import { useRouter } from 'next/navigation';
import type { Personality } from '@/types/personality-type';

type Props = {
  firstName: string;
  personality: Personality | null;
  assessedAt: string | null;
  redirectTo?: string;
};

export default function PersonalityChoice({
  firstName,
  personality,
  assessedAt,
  redirectTo = '/dashboard',
}: Readonly<Props>) {
  const router = useRouter();

  if (!personality) {
    return (
      <div className="px-8 py-7">
        <h1 className="mb-1 text-lg font-bold text-gray-800">
          Welcome{firstName ? `, ${firstName}` : ''}! 👋
        </h1>
        <p className="mb-5 text-sm text-gray-500">
          You haven&apos;t taken your personality test yet.
        </p>

        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-600">
            Discover your play personality — find out your play style and get
            matched with the right experiences. Takes about 5 minutes.
          </p>
        </div>

        <button
          onClick={() => router.push('/test')}
          className="mb-3 w-full rounded-lg bg-[#E91E8C] py-3 text-sm font-semibold text-white hover:bg-[#c7177a]"
        >
          Take test now →
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full rounded-lg border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-7">
      <h1 className="mb-1 text-lg font-bold text-gray-800">
        Welcome back{firstName ? `, ${firstName}` : ''}! 👋
      </h1>
      <p className="mb-5 text-sm text-gray-500">
        You&apos;re signed in. What would you like to do with your play
        personality?
      </p>

      {/* Current personality */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-gray-400">
          Your current personality
        </p>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E91E8C] text-lg">
            {personality.emoji}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {personality.name}
            </p>
            {assessedAt && (
              <p className="text-xs text-gray-400">Assessed {assessedAt}</p>
            )}
          </div>
        </div>
      </div>

      {/* Choice buttons */}
      <div className="mb-5 flex gap-3">
        <button
          onClick={() => router.push(redirectTo)}
          className="flex-1 rounded-lg border-2 border-[#E91E8C] bg-[#fff5f9] py-3 text-xs font-semibold text-[#E91E8C]"
        >
          ✓ Keep current personality
        </button>
        <button
          onClick={() => router.push('/test')}
          className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 py-3 text-xs font-semibold text-gray-600 hover:border-gray-300"
        >
          🔄 Retake test
        </button>
      </div>

      <button
        onClick={() => router.push(redirectTo)}
        className="w-full rounded-lg bg-[#E91E8C] py-3 text-sm font-semibold text-white hover:bg-[#c7177a]"
      >
        Continue to dashboard →
      </button>
    </div>
  );
}
