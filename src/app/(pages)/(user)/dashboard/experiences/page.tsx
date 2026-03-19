import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getPurchasableExperiences } from '@/services/experience-service';
import {
  formatCadAmount,
  getExperiencePricingSummary,
} from '@/utils/experience';
import { buildDashboardExperienceCheckoutPath } from '@/utils/url-helper';

function formatDuration(durationMin: number, durationMax: number): string {
  if (durationMin === durationMax) {
    return `${durationMin} min`;
  }

  return `${durationMin}-${durationMax} min`;
}

export default async function ExperiencesPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const experiences = await getPurchasableExperiences();

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Experiences</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse active experiences and pay securely with Stripe.
          </p>
        </div>

        {experiences.length === 0 ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-3xl">
              🎨
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No experiences are ready yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Once an experience is active and has pricing configured, it will
              appear here for checkout.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {experiences.map(experience => (
              <article
                key={experience.id}
                className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                      {experience.categoryTitle}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">
                      {experience.experienceTitle}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Hosted by {experience.providerLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      From
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {formatCadAmount(experience.pricing.startingPrice)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Duration
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDuration(
                        experience.durationMin,
                        experience.durationMax
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Capacity
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      Up to {experience.capacityMax}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Add-on
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCadAmount(experience.pricing.addingPrice)}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-gray-600">
                  {getExperiencePricingSummary(experience)}
                </p>

                {experience.pricing.pricingNotes ? (
                  <p className="mt-3 rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
                    {experience.pricing.pricingNotes}
                  </p>
                ) : null}

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Secure checkout
                    </p>
                    <p className="text-xs text-gray-500">
                      Powered by Stripe Elements
                    </p>
                  </div>

                  <Link
                    href={buildDashboardExperienceCheckoutPath(experience.id)}
                    className="inline-flex items-center justify-center rounded-full bg-magenta px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-deep"
                  >
                    Book now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
