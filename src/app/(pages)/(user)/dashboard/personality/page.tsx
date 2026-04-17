import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getUserDashboardData } from '@/services/user-dashboard-service';
import {
  computeAllPersonalityMatches,
  getPersonalityByKey,
} from '@/services/response-service';

export default async function PersonalityPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const data = await getUserDashboardData(authContext.user!.id);
  const { personality, totalScore } = data;

  if (!personality) {
    return (
      <div className="dashboard-glass-page">
        <div className="dashboard-glass-inner">
          <div className="dashboard-glass-stack">
            <section className="dashboard-glass-panel p-6 sm:p-8">
              <p className="dashboard-section-eyebrow">Personality profile</p>
              <h1 className="dashboard-section-title mt-2">Play Personality</h1>
              <p className="mt-2 text-sm text-slate-600">
                You haven&apos;t taken the assessment yet.
              </p>
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <span className="text-6xl">🎭</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Discover Your Play Personality
                  </h2>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    Take the Play Personality Assessment to unlock your unique
                    play style, curated experiences, and team insights.
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
          </div>
        </div>
      </div>
    );
  }

  // Compute all personality matches from the saved score
  const allMatchRaw =
    totalScore === null ? [] : await computeAllPersonalityMatches(totalScore);

  const allMatches = (
    await Promise.all(
      allMatchRaw.map(async ({ key, matchPercent }) => {
        const p = await getPersonalityByKey(key);
        return p ? { personality: p, matchPercent } : null;
      })
    )
  ).filter(Boolean) as {
    personality: typeof personality;
    matchPercent: number;
  }[];

  const primary = allMatches[0];
  const others = allMatches.slice(1);
  const accentColor = personality.accentColor ?? '#09191b';
  const topMatchPercent = primary?.matchPercent ?? null;
  const blendCount = others.filter(
    ({ matchPercent }) => matchPercent >= 50
  ).length;
  const heroBackground = `radial-gradient(circle at 84% 18%, color-mix(in srgb, ${accentColor} 44%, white) 0%, transparent 24%), radial-gradient(circle at 12% 120%, color-mix(in srgb, ${accentColor} 32%, black) 0%, transparent 30%), linear-gradient(135deg, #081316 0%, color-mix(in srgb, ${accentColor} 24%, #081316) 38%, color-mix(in srgb, ${accentColor} 58%, #101828) 72%, color-mix(in srgb, ${accentColor} 78%, #ffffff) 100%)`;
  const heroPanelBackground = `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 18%, rgba(255,255,255,0.2)), rgba(255,255,255,0.08))`;
  const scoreBand =
    totalScore === null
      ? 'Not available'
      : totalScore >= 80
        ? 'Strong signal'
        : totalScore >= 50
          ? 'Balanced signal'
          : 'Early signal';

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <section className="dashboard-glass-panel overflow-hidden">
            <div
              className="relative overflow-hidden px-6 py-6 sm:px-7 sm:py-7"
              style={{
                background: heroBackground,
              }}
            >
              <div className="absolute right-[-2.5rem] top-[-2.5rem] h-32 w-32 rounded-full bg-white/18 blur-2xl" />
              <div className="absolute bottom-[-3rem] left-[-1rem] h-28 w-28 rounded-full bg-black/28 blur-2xl" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-white/70">
                    Personality profile
                  </p>
                  <h1 className="mt-3 font-museo text-[1.9rem] font-bold tracking-[-0.04em] text-white drop-shadow-[0_14px_32px_rgba(0,0,0,0.28)] sm:text-[2.5rem]">
                    {personality.name}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-[0.95rem]">
                    {personality.description}
                  </p>
                </div>

                <div
                  className="relative flex items-center gap-4 self-start rounded-[1.6rem] border border-white/14 px-5 py-4 text-white shadow-[0_18px_38px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:min-w-[17rem]"
                  style={{ background: heroPanelBackground }}
                >
                  <span className="text-6xl leading-none">
                    {personality.emoji}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/62">
                      Primary type
                    </p>
                    <p className="mt-1 text-xl font-bold leading-tight">
                      {personality.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-white/70">
                      {personality.type}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/40 bg-white/72 px-5 py-5 backdrop-blur-xl sm:grid-cols-3 sm:px-6">
              <div className="rounded-[1.3rem] border border-white/75 bg-white/76 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Match strength
                </p>
                <p className="mt-2 text-[1.7rem] font-extrabold leading-none text-slate-900">
                  {topMatchPercent ? `${topMatchPercent}%` : '—'}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Confidence level for your strongest personality fit.
                </p>
              </div>

              <div className="rounded-[1.3rem] border border-white/75 bg-white/76 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Total score
                </p>
                <p className="mt-2 text-[1.7rem] font-extrabold leading-none text-slate-900">
                  {totalScore ?? '—'}
                </p>
                <p className="mt-2 text-xs text-slate-500">{scoreBand}</p>
              </div>

              <div className="rounded-[1.3rem] border border-white/75 bg-white/76 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Blend traits
                </p>
                <p className="mt-2 text-[1.7rem] font-extrabold leading-none text-slate-900">
                  {blendCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Additional personality matches above 50%.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)]">
            <section className="dashboard-glass-panel overflow-hidden">
              <div className="border-b border-gray-100/70 px-6 py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Match landscape
                </p>
                <h2 className="mt-2 font-museo text-[1.1rem] font-bold text-slate-900">
                  How your personality distributes across other types
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your strongest match is highlighted first, followed by nearby
                  personality patterns.
                </p>
              </div>

              <div className="space-y-3 px-4 py-4 sm:px-5">
                {allMatches.map(({ personality: p, matchPercent }, index) => {
                  const color = p.accentColor ?? '#09191b';
                  const isPrimary = index === 0;

                  return (
                    <div
                      key={p.type}
                      className={`rounded-[1.4rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)] ${
                        isPrimary
                          ? 'border-white/80 bg-white/82'
                          : 'border-white/65 bg-white/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] text-2xl shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
                          style={{
                            background: `linear-gradient(180deg, rgba(255,255,255,0.85), ${color}22)`,
                          }}
                        >
                          {p.emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-bold leading-tight text-slate-900">
                                  {p.name}
                                </p>
                                {isPrimary ? (
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                                    style={{
                                      backgroundColor: `${color}16`,
                                      color,
                                    }}
                                  >
                                    Primary
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                {p.type}
                              </p>
                            </div>

                            <div className="text-right">
                              <p
                                className="text-[1.35rem] font-extrabold leading-none"
                                style={{ color }}
                              >
                                {matchPercent}%
                              </p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                match
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${matchPercent}%`,
                                background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 55%, white))`,
                              }}
                            />
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="space-y-5">
              <section className="dashboard-glass-panel p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Focus areas
                </p>
                <h2 className="mt-2 font-museo text-[1.1rem] font-bold text-slate-900">
                  What matters most in this result
                </h2>
                <ul className="mt-4 space-y-3">
                  {[
                    {
                      icon: '🎯',
                      title: 'Use your strongest type first',
                      text: 'Start from your primary personality when choosing experiences, then use nearby matches as flexible edges.',
                    },
                    {
                      icon: '🧩',
                      title: 'Secondary traits still matter',
                      text: 'Your other matches show the styles you can comfortably stretch into, especially in mixed groups.',
                    },
                    {
                      icon: '📈',
                      title: 'This score powers recommendations',
                      text: 'Your saved personality result is what the dashboard uses to tailor suggestions and future matching.',
                    },
                  ].map(item => (
                    <li
                      key={item.title}
                      className="rounded-[1.2rem] border border-white/70 bg-white/72 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_8px_18px_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl leading-none">
                          {item.icon}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="dashboard-glass-panel p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Next action
                </p>
                <h2 className="mt-2 font-museo text-[1.1rem] font-bold text-slate-900">
                  Refresh your profile anytime
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Retake the assessment if your preferences have shifted or you
                  want a newer baseline for recommendations.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/dashboard/test"
                    className="dashboard-pill-button dashboard-pill-button--primary w-full"
                  >
                    Retake Assessment
                  </Link>
                  <p className="text-xs text-slate-400">
                    Retaking the test will replace your saved personality
                    result.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
