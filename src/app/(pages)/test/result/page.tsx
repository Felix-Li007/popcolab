import { redirect } from 'next/navigation';
import { getPersonalityByKey } from '@/services/response-service';
import type { Personality } from '@/types/personality-type';
import PlayPersonalities from '@/components/test/play-personalities';

type PersonalityMatch = {
  personality: Personality;
  matchPercent: number;
};

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ matches?: string }>;
}) {
  const params = await searchParams;
  const matchesParam = params.matches ?? '';

  if (!matchesParam) redirect('/test');

  const pairs = matchesParam
    .split('|')
    .filter(Boolean)
    .map(pair => {
      const [key, pct] = pair.split(':');
      return { key: key ?? '', matchPercent: parseInt(pct ?? '0', 10) };
    })
    .filter(p => p.key);

  if (pairs.length === 0) redirect('/test');

  const matchesData = await Promise.all(
    pairs.map(async ({ key, matchPercent }) => {
      const personality = await getPersonalityByKey(key);
      return personality ? { personality, matchPercent } : null;
    })
  );

  const matches = matchesData.filter(Boolean) as PersonalityMatch[];

  if (matches.length === 0) redirect('/test');

  return <PlayPersonalities matches={matches} />;
}
