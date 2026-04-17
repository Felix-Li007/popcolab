'use client';

import { useRouter } from 'next/navigation';
import type { Personality } from '@/types/personality-type';

const DASHBOARD_TEAMS_PATH = '/dashboard/teams';
const TEST_PATH = '/test';

type Props = {
  teamName: string;
  inviterName: string;
  firstName: string;
  personality: Personality | null;
  assessedAt: string | null;
};

export default function JoinPersonalityChoice({
  teamName,
  inviterName,
  firstName,
  personality,
  assessedAt,
}: Props) {
  const router = useRouter();

  return (
    <div className="px-8 py-7">
      {/* Team invite context */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <span className="mt-0.5 text-xl">✉️</span>
        <div>
          <p className="text-sm font-bold text-green-800">
            Joining: {teamName}
          </p>
          <p className="text-xs text-green-700">
            Invited by <strong>{inviterName}</strong> · Pop CoLab
          </p>
        </div>
      </div>

      <h1 className="mb-1 text-lg font-bold text-gray-800">
        You&apos;re in{firstName ? `, ${firstName}` : ''}! 👋
      </h1>
      {personality ? (
        <>
          <p className="mb-5 text-sm text-gray-500">
            You&apos;ve joined the team. Would you like to keep your current
            play personality or retake the test?
          </p>

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

          <div className="mb-5 flex gap-3">
            <button
              onClick={() => router.push(DASHBOARD_TEAMS_PATH)}
              className="flex-1 rounded-lg border-2 border-[#E91E8C] bg-[#fff5f9] py-3 text-xs font-semibold text-[#E91E8C]"
            >
              ✓ Keep current personality
            </button>
            <button
              onClick={() => router.push(TEST_PATH)}
              className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 py-3 text-xs font-semibold text-gray-600 hover:border-gray-300"
            >
              🔄 Retake test
            </button>
          </div>

          <button
            onClick={() => router.push(DASHBOARD_TEAMS_PATH)}
            className="w-full rounded-lg bg-[#E91E8C] py-3 text-sm font-semibold text-white hover:bg-[#c7177a]"
          >
            Continue to your team →
          </button>
        </>
      ) : (
        <>
          <p className="mb-5 text-sm text-gray-500">
            You&apos;ve joined the team. You haven&apos;t taken your play
            personality test yet, so you can choose to do it now or continue for
            later.
          </p>

          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">
              The personality test helps Pop CoLab tailor recommendations and
              team insights for you. It only takes a few minutes.
            </p>
          </div>

          <div className="mb-5 flex gap-3">
            <button
              onClick={() => router.push(DASHBOARD_TEAMS_PATH)}
              className="flex-1 rounded-lg border-2 border-gray-200 bg-white py-3 text-xs font-semibold text-gray-600 hover:border-gray-300"
            >
              Maybe later
            </button>
            <button
              onClick={() => router.push(TEST_PATH)}
              className="flex-1 rounded-lg border-2 border-[#E91E8C] bg-[#fff5f9] py-3 text-xs font-semibold text-[#E91E8C]"
            >
              Take test now
            </button>
          </div>

          <button
            onClick={() => router.push(DASHBOARD_TEAMS_PATH)}
            className="w-full rounded-lg bg-[#E91E8C] py-3 text-sm font-semibold text-white hover:bg-[#c7177a]"
          >
            Accept →
          </button>
        </>
      )}
    </div>
  );
}
