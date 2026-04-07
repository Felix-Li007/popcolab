'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Personality } from '@/types/personality-type';
import { cssVarStyle } from '@/utils/css-helper';
import styles from '@/styles/play-personality.module.css';
import ctaStyles from '@/styles/landing-ctasection.module.css';

type PersonalityMatch = {
  personality: Personality;
  matchPercent: number;
};

type Props = {
  matches: PersonalityMatch[];
  isAuthenticated: boolean;
  primaryKey: string;
  retakeHref?: string;
};

const BENEFITS = [
  {
    icon: '🎯',
    title: 'Curated Experiences',
    desc: 'Get matched with play experiences built for your personality type.',
  },
  {
    icon: '👥',
    title: 'Team Dynamics',
    desc: 'See how your style blends with your team to unlock better collaboration.',
  },
  {
    icon: '📊',
    title: 'Saved Profile',
    desc: 'Keep your results and track how your play style evolves over time.',
  },
];

export default function PlayPersonalities({
  matches,
  isAuthenticated,
  primaryKey,
  retakeHref = '/test',
}: Readonly<Props>) {
  const [copied, setCopied] = useState(false);

  const primary = matches[0];
  const others = matches.slice(1);

  const saveRedirectUrl = `/test/save?key=${encodeURIComponent(primaryKey)}`;

  async function handleShare() {
    const top = matches[0];
    const text = top
      ? `I just took the Pop CoLab Play Personality Test and I'm a "${top.personality.name}" ${top.personality.emoji}`
      : 'I just took the Pop CoLab Play Personality Test!';
    const url = globalThis.location.href;

    if (globalThis.navigator.share) {
      await globalThis.navigator.share({
        title: 'My Play Personality',
        text,
        url,
      });
    } else {
      await globalThis.navigator.clipboard.writeText(`${text} — ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="flex flex-col gap-8" data-testid="results-page">
      <div className="flex flex-col gap-1">
        <p className="dashboard-section-eyebrow">Pop CoLab</p>
        <h1 className="dashboard-section-title mt-2">
          Your Play Personalities
        </h1>
        <p className="text-sm text-gray-500">
          Based on your responses, you match with these personality types
        </p>
      </div>

      {/* Personality grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr] md:gap-6">
        {/* Primary card */}
        {primary && (
          <div
            className={styles.primaryCard}
            data-testid="results-primary-card"
            style={cssVarStyle({
              '--card-accent': primary.personality.accentColor ?? '#0d9488',
            })}
          >
            <div
              className={styles.cardHeader}
              style={{
                backgroundColor: primary.personality.accentColor ?? '#0d9488',
              }}
            >
              <span className={styles.badge}>PRIMARY</span>
              <span className={styles.emoji}>{primary.personality.emoji}</span>
            </div>

            <div className="bg-white p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-800 leading-tight">
                  {primary.personality.name}
                </h2>
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-2xl font-extrabold leading-none"
                    style={{
                      color: primary.personality.accentColor ?? '#0d9488',
                    }}
                  >
                    {primary.matchPercent}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">match</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {primary.personality.description}
              </p>
            </div>
          </div>
        )}

        {/* Other matches panel */}
        {others.length > 0 && (
          <div className={styles.otherCard} data-testid="results-other-matches">
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
        className="dashboard-pill-button dashboard-pill-button--secondary"
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

      {/* Benefit tiles */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        data-testid="results-benefit-tiles"
      >
        {BENEFITS.map(({ icon, title, desc }) => (
          <div
            key={title}
            className="rounded-[1.5rem] border border-white/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.76))] p-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl flex flex-col gap-2"
            data-testid="results-benefit-tile"
          >
            <span className="text-2xl">{icon}</span>
            <p className="text-sm font-bold text-gray-800">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA — changes based on auth state */}
      <div
        className="flex flex-col gap-4 items-center text-center"
        data-testid="results-cta"
      >
        {isAuthenticated ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-800">
                Your result has been saved!
              </h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Head to your dashboard to see your personality, teams, and
                experience requests.
              </p>
            </div>
            <Link
              href="/dashboard"
              className={`${ctaStyles.primaryButton} dashboard-pill-button dashboard-pill-button--primary block w-full text-center`}
            >
              Go to my dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-800">
                Ready to unlock everything?
              </h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Create a free account to save your profile, unlock experiences,
                and explore your team dynamics.
              </p>
            </div>
            <Link
              href={`/sign-up?redirect_url=${encodeURIComponent(saveRedirectUrl)}`}
              className={`${ctaStyles.primaryButton} dashboard-pill-button dashboard-pill-button--primary block w-full text-center`}
              onClick={() =>
                localStorage.setItem('pclab_pending_key', primaryKey)
              }
            >
              Create free account — it&apos;s free
            </Link>
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(saveRedirectUrl)}`}
                className="underline hover:opacity-75"
                onClick={() =>
                  localStorage.setItem('pclab_pending_key', primaryKey)
                }
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>

      <Link
        href={retakeHref}
        className="text-sm text-gray-400 underline underline-offset-4 hover:opacity-75 text-center"
      >
        Retake the test
      </Link>
    </div>
  );
}
