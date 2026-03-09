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
}: Props) {
  if (!personality) {
    return (
      <section className="rounded-[28px] border border-gray-200 bg-white/90 p-6 shadow-sm">
        <div
          className="flex flex-col items-center justify-center gap-4 py-8 text-center"
          data-testid="personality-empty-state"
        >
          <div className="text-5xl">🎭</div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Discover Your Play Personality
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Take the Play Personality Assessment to unlock your unique play
              style, curated experiences, and team insights.
            </p>
          </div>
          <Link
            href="/test"
            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep/90 transition-colors"
          >
            Take the Assessment →
          </Link>
        </div>
      </section>
    );
  }

  const accentColor = personality.accentColor ?? '#09191b';

  return (
    <section
      className="rounded-[28px] border border-gray-200 bg-white/90 shadow-sm overflow-hidden"
      data-testid="personality-result-card"
    >
      {/* Accent header */}
      <div
        className="px-6 pt-6 pb-4"
        style={{ backgroundColor: accentColor + '18' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">{personality.emoji}</span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Your Play Personality
              </p>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                {personality.name}
              </h2>
            </div>
          </div>
          {totalScore !== null && (
            <div
              className="shrink-0 rounded-2xl px-3 py-1.5 text-center"
              style={{ backgroundColor: accentColor + '22' }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: accentColor }}
              >
                Score
              </p>
              <p className="text-lg font-bold" style={{ color: accentColor }}>
                {Math.round(totalScore)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {personality.description}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/test"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-teal-deep hover:text-teal-deep transition-colors"
          >
            🔄 Retake Test
          </Link>
          <span className="text-xs text-gray-400">
            Results are saved to your profile
          </span>
        </div>
      </div>
    </section>
  );
}
