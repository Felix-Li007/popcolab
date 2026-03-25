'use client';

import Link from 'next/link';
import type { Personality } from '@/types/personality-type';

type Props = {
  personality: Personality | null;
  totalScore: number | null;
};

export default function PersonalityResultCard({
  personality,
  totalScore,
}: Readonly<Props>) {
  if (!personality) {
    return (
      <section className="rounded-[28px] border border-[rgba(1,43,48,0.08)] bg-[rgba(255,255,255,0.82)] p-6 shadow-sm">
        <div
          className="flex flex-col items-center justify-center gap-4 py-8 text-center"
          data-testid="personality-empty-state"
        >
          <div className="text-5xl">🎭</div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Discover Your Play Personality
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Take the Play Personality Assessment to unlock your unique play
              style, curated experiences, and team insights.
            </p>
          </div>
          <Link
            href="/test"
            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-700 transition-colors"
          >
            Take the Assessment →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-[28px] border border-[rgba(1,43,48,0.08)] bg-[rgba(255,255,255,0.82)] shadow-sm overflow-hidden"
      data-testid="personality-result-card"
    >
      {/* Accent header */}
      <div className="px-6 pt-6 pb-4 bg-rose-100/75">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">{personality.emoji}</span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Your Play Personality
              </p>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {personality.name}
              </h2>
            </div>
          </div>
          {totalScore !== null && (
            <div className="shrink-0 rounded-2xl px-3 py-1.5 text-center bg-white/70">
              <p className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-600">
                Score
              </p>
              <p className="text-lg font-bold text-fuchsia-600">
                {Math.round(totalScore)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <p className="text-sm text-slate-700 leading-relaxed">
          {personality.description}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/test"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-fuchsia-600 hover:text-fuchsia-600 transition-colors"
          >
            🔄 Retake Test
          </Link>
          <span className="text-xs text-slate-400">
            Results are saved to your profile
          </span>
        </div>
      </div>
    </section>
  );
}
