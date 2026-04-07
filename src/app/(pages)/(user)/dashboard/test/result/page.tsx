import { redirect } from 'next/navigation';
import { getPersonalityByKey } from '@/services/response-service';
import { getCurrentAuthContext } from '@/services/clerk-service';
import type { Personality } from '@/types/personality-type';
import PlayPersonalities from '@/components/front/test/play-personalities';

type PersonalityMatch = {
  personality: Personality;
  matchPercent: number;
};

export default async function DashboardResultPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ matches?: string }>;
}>) {
  const params = await searchParams;
  const matchesParam = params.matches ?? '';

  if (!matchesParam) redirect('/dashboard/test');

  const pairs = matchesParam
    .split('|')
    .filter(Boolean)
    .map(pair => {
      const [key, pct] = pair.split(':');
      return { key: key ?? '', matchPercent: Number.parseInt(pct ?? '0', 10) };
    })
    .filter(p => p.key);

  if (pairs.length === 0) redirect('/dashboard/test');

  const [matchesData, authContext] = await Promise.all([
    Promise.all(
      pairs.map(async ({ key, matchPercent }) => {
        const personality = await getPersonalityByKey(key);
        return personality ? { personality, matchPercent } : null;
      })
    ),
    getCurrentAuthContext(),
  ]);

  const matches = matchesData.filter(Boolean) as PersonalityMatch[];

  if (matches.length === 0) redirect('/dashboard/test');

  const primaryKey = matches[0]?.personality.type ?? '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PlayPersonalities
        matches={matches}
        isAuthenticated={authContext.isAuthenticated}
        primaryKey={primaryKey}
        retakeHref="/dashboard/test"
      />
    </div>
  );
}
