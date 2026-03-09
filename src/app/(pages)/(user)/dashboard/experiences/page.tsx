import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';

export default async function ExperiencesPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Experiences</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Curated play experiences matched to your personality.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-10 flex flex-col items-center gap-4 text-center">
        <span className="text-6xl">🎨</span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Coming Soon</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Curated experiences tailored to your play personality will appear
            here once they&apos;re available.
          </p>
        </div>
      </div>
    </div>
  );
}
