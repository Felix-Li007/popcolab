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
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Play Personality
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          You haven&apos;t taken the assessment yet.
        </p>
        <div className="rounded-2xl border border-gray-200 bg-white p-10 flex flex-col items-center gap-4 text-center shadow-sm">
          <span className="text-6xl">🎭</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Discover Your Play Personality
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Take the Play Personality Assessment to unlock your unique play
              style, curated experiences, and team insights.
            </p>
          </div>
          <Link
            href="/test"
            className="mt-2 rounded-2xl bg-teal-deep px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-deep/90 transition-colors"
          >
            Take the Assessment →
          </Link>
        </div>
      </div>
    );
  }

  // Compute all personality matches from the saved score
  const allMatchRaw =
    totalScore !== null ? await computeAllPersonalityMatches(totalScore) : [];

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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Play Personality</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your saved personality profile from the assessment.
        </p>
      </div>

      {/* Primary result card */}
      <div
        className="rounded-2xl overflow-hidden border shadow-sm"
        style={{ borderColor: accentColor + '40' }}
      >
        {/* Coloured header */}
        <div
          className="px-6 py-5 flex items-center gap-4"
          style={{ backgroundColor: accentColor }}
        >
          <span className="text-5xl leading-none">{personality.emoji}</span>
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-75">
              Primary Type
            </p>
            <h2 className="text-2xl font-bold leading-tight mt-0.5">
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

        {/* Description */}
        <div className="bg-white px-6 py-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            {personality.description}
          </p>
        </div>
      </div>

      {/* Other personality matches */}
      {others.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Other Matches</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              You also show traits of these personality types
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {others.map(({ personality: p, matchPercent }) => {
              const color = p.accentColor ?? '#09191b';
              return (
                <div
                  key={p.type}
                  className="flex items-center gap-3 px-6 py-3.5"
                >
                  <span className="text-2xl leading-none">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {p.description}
                    </p>
                  </div>
                  {/* Match bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${matchPercent}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-bold w-9 text-right"
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

      {/* What this means */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-3">
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
              <span className="text-lg leading-none mt-0.5">{icon}</span>
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Retake */}
      <div className="flex items-center gap-3">
        <Link
          href="/test"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-teal-deep hover:text-teal-deep transition-colors"
        >
          🔄 Retake Assessment
        </Link>
        <span className="text-xs text-gray-400">
          Retaking will update your saved result.
        </span>
      </div>
    </div>
  );
}
