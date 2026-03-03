'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Personality } from '@/types/personality-type';
import { cssVarStyle } from '@/utils/css-helper';
import styles from '@/styles/play-personality.module.css';
import cardStyles from '@/styles/personality-card.module.css';
import ctaStyles from '@/styles/landing-ctasection.module.css';

type PersonalityMatch = {
  personality: Personality;
  matchPercent: number;
};

type Props = {
  matches: PersonalityMatch[];
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

const EXPERIENCE_TEASERS = [
  {
    emoji: '🎨',
    title: 'Creative Sprint Workshop',
    tag: 'For Creators',
    color: '#c026d3',
  },
  {
    emoji: '🧩',
    title: 'Strategic Play Session',
    tag: 'For Strategists',
    color: '#0891b2',
  },
  {
    emoji: '🎭',
    title: 'Improv & Connection',
    tag: 'For Performers',
    color: '#ea580c',
  },
];

export default function PlayPersonalities({ matches }: Props) {
  const [copied, setCopied] = useState(false);

  const primary = matches[0];
  const others = matches.slice(1);

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
    <div className="flex flex-col gap-8" data-testid="results-page">
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
            {/* Colored header */}
            <div
              className={styles.cardHeader}
              style={{
                backgroundColor: primary.personality.accentColor ?? '#0d9488',
              }}
            >
              <span className={styles.badge}>PRIMARY</span>
              <span className={styles.emoji}>{primary.personality.emoji}</span>
            </div>

            {/* White content */}
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

      {/* Benefit tiles */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        data-testid="results-benefit-tiles"
      >
        {BENEFITS.map(({ icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
            data-testid="results-benefit-tile"
          >
            <span className="text-2xl">{icon}</span>
            <p className="text-sm font-bold text-gray-800">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Experience teasers */}
      <div
        className="flex flex-col gap-3"
        data-testid="results-experience-teasers"
      >
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold text-gray-800">
            Experiences made for you
          </h2>
          <p className="text-xs text-gray-400">
            Sign up to unlock curated activities that match your play
            personality.
          </p>
        </div>
        <div className={cardStyles.cardGrid}>
          {EXPERIENCE_TEASERS.map(({ emoji, title, tag, color }) => (
            <div
              key={title}
              className={`${cardStyles.card} group`}
              data-testid="results-experience-card"
              style={cssVarStyle({ '--glow-color': `${color}40` })}
            >
              <div className={cardStyles.orb} />
              {/* Lock overlay — fades in on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 z-10"
                style={{ background: 'rgba(9,25,27,0.55)' }}
              >
                <span className={styles.experienceLockBadge}>
                  🔒 Sign up to unlock
                </span>
              </div>
              {/* Card content */}
              <div className="relative z-[1] flex flex-col gap-2 p-4 h-full">
                <span
                  className="text-xs font-bold tracking-wide rounded-full px-2.5 py-0.5 w-fit"
                  style={{ background: `${color}20`, color }}
                >
                  {tag}
                </span>
                <span className="text-3xl leading-none mt-auto">{emoji}</span>
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4"
        data-testid="results-team-banner"
        style={{
          background:
            'linear-gradient(to bottom right, var(--color-teal-deep), var(--color-teal-medium))',
        }}
      >
        <div className={ctaStyles.pinkCircle} />
        <div className={ctaStyles.lightCircle} />
        <div className="relative z-10 flex flex-col gap-3">
          {/* Emoji chips — one per top match */}
          <div className="flex gap-2 flex-wrap">
            {matches.slice(0, 4).map(({ personality }) => (
              <div key={personality.type} className={styles.teamEmojiChip}>
                {personality.emoji}
              </div>
            ))}
            <div className={styles.teamEmojiChip}>➕</div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              Build your dream team
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Map every team member&apos;s play personality and unlock curated
              group experiences together.
            </p>
          </div>
        </div>
      </div>

      {/* Improved CTA */}
      <div
        className="flex flex-col gap-4 items-center text-center"
        data-testid="results-cta"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-800">
            Ready to unlock everything?
          </h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Create a free account to save your profile, unlock experiences, and
            explore your team dynamics.
          </p>
        </div>
        <Link
          href="/sign-up"
          className={`${ctaStyles.primaryButton} block w-full text-center`}
        >
          Create free account — it&apos;s free
        </Link>
        <p className="text-xs text-gray-400">
          Already have an account?{' '}
          <Link href="/sign-in" className="underline hover:opacity-75">
            Sign in
          </Link>
        </p>
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
