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

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <section className="dashboard-glass-panel p-6">
            <p className="dashboard-section-eyebrow">Personality profile</p>
            <h1 className="dashboard-section-title mt-2">Play Personality</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your saved personality profile from the assessment.
            </p>
          </section>

          <div
            className="dashboard-glass-panel overflow-hidden"
            style={{ borderColor: accentColor + '40' }}
          >
            <div
              className="flex items-center gap-4 px-6 py-5"
              style={{ backgroundColor: accentColor }}
            >
              <span className="text-5xl leading-none">{personality.emoji}</span>
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-widest opacity-75">
                  Primary Type
                </p>
                <h2 className="mt-0.5 text-2xl font-bold leading-tight">
                  {personality.name}
                </h2>
              </div>
              {primary && (
                <div className="ml-auto text-right text-white">
                  <p className="text-xs font-bold uppercase tracking-wide opacity-75">
                    Match
                  </p>
                  <p className="text-3xl font-extrabold leading-none">
                    {primary.matchPercent}%
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/72 px-6 py-5 backdrop-blur-xl">
              <p className="text-sm leading-relaxed text-gray-600">
                {personality.description}
              </p>
            </div>
          </div>

          {others.length > 0 && (
            <div className="dashboard-glass-panel overflow-hidden">
              <div className="border-b border-gray-100/70 px-6 py-4">
                <h3 className="text-sm font-bold text-gray-800">
                  Other Matches
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  You also show traits of these personality types
                </p>
              </div>
              <div className="divide-y divide-gray-50/90">
                {others.map(({ personality: p, matchPercent }) => {
                  const color = p.accentColor ?? '#09191b';
                  return (
                    <div
                      key={p.type}
                      className="flex items-center gap-3 px-6 py-3.5"
                    >
                      <span className="text-2xl leading-none">{p.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight text-gray-800">
                          {p.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {p.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${matchPercent}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span
                          className="w-9 text-right text-sm font-bold"
                          style={{ color }}
                        >
                          {matchPercent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="dashboard-glass-panel p-6 space-y-3">
            <h3 className="text-sm font-bold text-gray-800">
              What this means for you
            </h3>
            <ul className="space-y-2.5">
              {[
                {
                  icon: '🎯',
                  text: 'You thrive in activities that match your natural play style.',
                },
                {
                  icon: '👥',
                  text: 'Understanding your type helps your team collaborate better.',
                },
                {
                  icon: '📊',
                  text: 'Your profile is saved and will improve experience matching.',
                },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-lg leading-none">{icon}</span>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/test"
              className="dashboard-pill-button dashboard-pill-button--secondary"
            >
              🔄 Retake Assessment
            </Link>
            <span className="text-xs text-gray-400">
              Retaking will update your saved result.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
