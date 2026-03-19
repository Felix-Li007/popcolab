import Link from 'next/link';
import { redirect } from 'next/navigation';
import ExperienceCheckoutClient from '@/components/dashboard/checkout-client';
import { getStripePublishableKey } from '@/libs/stripe-server';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getPurchasableExperienceById } from '@/services/experience-service';
import { DASHBOARD_EXPERIENCES_PATH } from '@/utils/url-helper';

type PageProps = {
  params: Promise<{ experienceId: string }>;
};

function getDefaultRequestedHours(params: {
  durationMax: number;
  startingHour: number | null;
}): number {
  if (params.startingHour !== null && params.startingHour > 0) {
    return params.startingHour;
  }

  return Math.max(1, Math.ceil(params.durationMax / 60));
}

export default async function ExperienceCheckoutPage({ params }: PageProps) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    redirect('/sign-in');
  }

  const { experienceId } = await params;
  const parsedExperienceId = Number(experienceId);
  if (!Number.isInteger(parsedExperienceId) || parsedExperienceId <= 0) {
    redirect(DASHBOARD_EXPERIENCES_PATH);
  }

  const experience = await getPurchasableExperienceById(parsedExperienceId);
  if (!experience) {
    redirect(DASHBOARD_EXPERIENCES_PATH);
  }

  const publishableKey = getStripePublishableKey();
  const minRequestedHours =
    experience.pricing.startingHour !== null &&
    experience.pricing.startingHour > 0
      ? experience.pricing.startingHour
      : 1;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href={DASHBOARD_EXPERIENCES_PATH}
            className="text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            Back to experiences
          </Link>
        </div>

        <ExperienceCheckoutClient
          publishableKey={publishableKey}
          experience={{
            id: experience.id,
            categoryTitle: experience.categoryTitle,
            experienceTitle: experience.experienceTitle,
            providerLabel: experience.providerLabel,
            durationMin: experience.durationMin,
            durationMax: experience.durationMax,
            pricing: experience.pricing,
          }}
          defaultRequestedHours={getDefaultRequestedHours({
            durationMax: experience.durationMax,
            startingHour: experience.pricing.startingHour,
          })}
          minRequestedHours={minRequestedHours}
        />
      </div>
    </div>
  );
}
