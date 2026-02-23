'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Personality } from '@/types/personality-type';
import { cssVarStyle } from '@/utils/css-helper';

type Props = {
  personality: Personality;
  totalScore: number;
};

export default function TestResult({ personality, totalScore }: Props) {
  const [copied, setCopied] = useState(false);

  const glowStyle = personality.accentColor
    ? cssVarStyle({ '--glow-color': personality.accentColor })
    : undefined;

  async function handleShare() {
    const text = `I just took the Pop CoLab Play Personality Test and I'm a "${personality.name}" ${personality.emoji}`;
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: 'My Play Personality', text, url });
    } else {
      await navigator.clipboard.writeText(`${text} — ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm mx-auto">
      <p className="text-sm text-gray-500">Your play personality is</p>

      {/* Result card */}
      <div
        className="w-full rounded-2xl border border-gray-100 bg-white shadow-lg p-6 flex flex-col items-center gap-3"
        style={glowStyle}
      >
        <div className="text-5xl">{personality.emoji}</div>

        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: personality.accentColor ?? '#0d9488' }}
        >
          {personality.type}
        </div>

        <h1 className="text-2xl font-bold text-gray-800">{personality.name}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {personality.description}
        </p>

        {/* Stars */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${i < personality.stars ? 'text-yellow-400' : 'text-gray-200'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        <p className="text-xs text-gray-400">Score: {totalScore}</p>
      </div>

      {/* Share */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-teal-deep text-sm font-semibold text-teal-deep hover:bg-teal-deep hover:text-white transition-all"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {copied ? 'Link copied!' : 'Share my result'}
      </button>

      {/* Save result — auth CTAs */}
      <div className="w-full rounded-xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">
          Want to save your result?
        </p>
        <p className="text-xs text-gray-400">
          Create a free account to keep your personality profile and get matched
          with experiences.
        </p>
        <Link
          href="/sign-up"
          className="w-full px-4 py-2.5 rounded-lg bg-teal-deep text-white text-sm font-semibold text-center hover:opacity-90 transition-all"
        >
          Create free account
        </Link>
        <Link
          href="/sign-in"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 text-center hover:bg-gray-100 transition-all"
        >
          Sign in to existing account
        </Link>
      </div>

      <Link
        href="/test"
        className="text-sm text-gray-400 underline underline-offset-4 hover:opacity-75"
      >
        Retake the test
      </Link>
    </div>
  );
}
