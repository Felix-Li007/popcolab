'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Personality } from '@/types/personality-type';
import { respondToTeamInviteAction } from '@/actions/team-actions';

type Props = {
  inviteId: number;
  teamName: string;
  inviterName: string;
  firstName: string;
  personality: Personality;
  assessedAt: string | null;
};

export default function JoinPersonalityChoice({
  inviteId,
  teamName,
  inviterName,
  firstName,
  personality,
  assessedAt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleKeep() {
    startTransition(async () => {
      await respondToTeamInviteAction(inviteId, 'accept');
      router.push('/dashboard/teams');
    });
  }

  function handleRetake() {
    startTransition(async () => {
      await respondToTeamInviteAction(inviteId, 'accept');
      router.push('/test');
    });
  }

  const formattedDate = assessedAt
    ? new Date(assessedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

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
        Welcome back{firstName ? `, ${firstName}` : ''}! 👋
      </h1>
      <p className="mb-5 text-sm text-gray-500">
        Before joining, what would you like to do with your play personality?
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
            {formattedDate && (
              <p className="text-xs text-gray-400">Assessed {formattedDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Choice buttons */}
      <div className="mb-5 flex gap-3">
        <button
          onClick={handleKeep}
          disabled={pending}
          className="flex-1 rounded-lg border-2 border-[#E91E8C] bg-[#fff5f9] py-3 text-xs font-semibold text-[#E91E8C] disabled:opacity-60"
        >
          ✓ Keep current personality
        </button>
        <button
          onClick={handleRetake}
          disabled={pending}
          className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 py-3 text-xs font-semibold text-gray-600 hover:border-gray-300 disabled:opacity-60"
        >
          🔄 Retake test
        </button>
      </div>

      <button
        onClick={handleKeep}
        disabled={pending}
        className="w-full rounded-lg bg-[#E91E8C] py-3 text-sm font-semibold text-white hover:bg-[#c7177a] disabled:opacity-60"
      >
        {pending ? 'Joining…' : `Join ${teamName} & continue →`}
      </button>
    </div>
  );
}
