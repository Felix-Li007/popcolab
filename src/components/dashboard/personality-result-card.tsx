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
      <section className="dashboard-glass-panel p-6">
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
            href="/dashboard/test"
            className="dashboard-pill-button dashboard-pill-button--primary mt-2"
          >
            Take the Assessment →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="dashboard-glass-panel overflow-hidden"
      data-testid="personality-result-card"
    >
      {/* Accent header */}
      <div className="bg-[linear-gradient(135deg,rgba(255,232,241,0.92),rgba(255,255,255,0.46))] px-6 pb-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">{personality.emoji}</span>
            <div>
              <p className="dashboard-section-eyebrow">Your Play Personality</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {personality.name}
              </h2>
            </div>
          </div>
          {totalScore !== null && (
            <div className="rounded-[1.35rem] border border-white/70 bg-white/72 px-4 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-fuchsia-600">
                Score
              </p>
              <p className="mt-1 text-xl font-extrabold leading-none text-fuchsia-600">
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
            href="/dashboard/test"
            className="dashboard-pill-button dashboard-pill-button--secondary"
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
