import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import {
  getTestResult,
  findOrCreateUserByEmail,
} from '@/services/response-service';
import TestResult from '@/components/test/test-result';

export default async function ResultPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) redirect('/test');

  const userId = await findOrCreateUserByEmail(
    email,
    clerkUser.fullName ?? undefined
  );
  const result = await getTestResult(userId);

  if (!result) {
    redirect('/test');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Pop CoLab
        </p>
        <h1 className="text-2xl font-bold text-gray-800">Your Result</h1>
      </div>

      <TestResult
        personality={result.personality}
        totalScore={result.totalScore}
      />
    </div>
  );
}
