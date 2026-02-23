'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Personality } from '@/types/personality-type';
import { cssVarStyle } from '@/utils/css-helper';
import styles from '@/styles/play-personalities.module.css';

type PersonalityMatch = {
  personality: Personality;
  matchPercent: number;
};

type Props = {
  matches: PersonalityMatch[];
};

export default function PlayPersonalities({ matches }: Props) {
  const [copied, setCopied] = useState(false);

  const primary = matches.slice(0, 2);
  const others = matches.slice(2);

  async function handleShare() {
    const top = matches[0];
    const text = top
      ? `I just took the Pop CoLab Play Personality Test and I'm a "${top.personality.name}" ${top.personality.emoji}`
      : 'I just took the Pop CoLab Play Personality Test!';
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
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest">
          Pop CoLab
        </p>
        <h1 className="text-2xl font-bold text-gray-800">
          Your Play Personalities
        </h1>
        <p className="text-sm text-gray-500">
          Based on your responses, you match with these personality types
        </p>
      </div>

      {/* Personality grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {/* Primary cards */}
        {primary.map(({ personality, matchPercent }) => (
          <div
            key={personality.type}
            className={styles.primaryCard}
            style={cssVarStyle({
              '--card-accent': personality.accentColor ?? '#0d9488',
            })}
          >
            {/* Colored header */}
            <div
              className={styles.cardHeader}
              style={{ backgroundColor: personality.accentColor ?? '#0d9488' }}
            >
              <span className={styles.badge}>PRIMARY</span>
              <span className={styles.emoji}>{personality.emoji}</span>
            </div>

            {/* White content */}
            <div className="bg-white p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-800 leading-tight">
                  {personality.name}
                </h2>
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-2xl font-extrabold leading-none"
                    style={{ color: personality.accentColor ?? '#0d9488' }}
                  >
                    {matchPercent}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">match</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                {personality.description}
              </p>
            </div>
          </div>
        ))}

        {/* Other matches panel */}
        {others.length > 0 && (
          <div className={styles.otherCard}>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800">Other Matches</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                You also show traits of these personalities
              </p>
            </div>

            {others.map(({ personality, matchPercent }) => (
              <div key={personality.type} className={styles.otherRow}>
                <span className={styles.otherEmoji}>{personality.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 leading-tight">
                    {personality.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {personality.description}
                  </p>
                </div>
                <span
                  className="text-sm font-bold flex-shrink-0"
                  style={{ color: personality.accentColor ?? '#0d9488' }}
                >
                  {matchPercent}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-teal-deep text-sm font-semibold text-teal-deep hover:bg-teal-deep hover:text-white transition-all"
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
        {copied ? 'Link copied!' : 'Share my results'}
      </button>

      {/* Auth CTAs */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
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
        className="text-sm text-gray-400 underline underline-offset-4 hover:opacity-75 text-center"
      >
        Retake the test
      </Link>
    </div>
  );
}
