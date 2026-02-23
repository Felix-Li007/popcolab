import { redirect } from 'next/navigation';
import { getPersonalityByKey } from '@/services/response-service';
import TestResult from '@/components/test/test-result';

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; score?: string }>;
}) {
  const params = await searchParams;
  const type = params.type;
  const totalScore = parseInt(params.score ?? '0');

  if (!type) redirect('/test');

  const personality = await getPersonalityByKey(type);
  if (!personality) redirect('/test');

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Pop CoLab
        </p>
        <h1 className="text-2xl font-bold text-gray-800">Your Result</h1>
      </div>

      <TestResult personality={personality} totalScore={totalScore} />
    </div>
  );
}
