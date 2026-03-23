import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { syncExperienceOrderPayment } from '@/services/order-service';
import {
  DASHBOARD_EXPERIENCES_PATH,
  buildDashboardExperienceCheckoutPath,
} from '@/utils/url-helper';
import { formatCadAmount } from '@/utils/experience';

type SearchParamsInput = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ experienceId: string }>;
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

function getFirstValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getStatusContent(status: string) {
  switch (status) {
    case 'paid':
      return {
        title: 'Payment received',
        tone: 'bg-emerald-50 text-emerald-800',
        body: 'Your booking has been paid successfully.',
      };
    case 'processing':
      return {
        title: 'Payment processing',
        tone: 'bg-amber-50 text-amber-800',
        body: 'Stripe is still processing the payment. Refresh this page in a moment if needed.',
      };
    case 'payment_failed':
      return {
        title: 'Payment needs attention',
        tone: 'bg-rose-50 text-rose-800',
        body: 'The payment was not completed. You can return to checkout and try again.',
      };
    case 'canceled':
      return {
        title: 'Payment canceled',
        tone: 'bg-gray-100 text-gray-700',
        body: 'The payment was canceled before completion.',
      };
    default:
      return {
        title: 'Booking reserved',
        tone: 'bg-sky-50 text-sky-800',
        body: 'Your order is reserved, but the payment is not complete yet.',
      };
  }
}

export default async function ExperienceCheckoutResultPage({
  params,
  searchParams,
}: Readonly<PageProps>) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    redirect('/sign-in');
  }

  const { experienceId } = await params;
  const resolvedSearchParams: SearchParamsInput = searchParams
    ? await searchParams
    : {};

  const parsedExperienceId = Number(experienceId);
  const parsedOrderId = Number(getFirstValue(resolvedSearchParams.orderId));
  const paymentIntentId = getFirstValue(resolvedSearchParams.payment_intent);

  if (!Number.isInteger(parsedExperienceId) || parsedExperienceId <= 0) {
    redirect(DASHBOARD_EXPERIENCES_PATH);
  }

  if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
    redirect(buildDashboardExperienceCheckoutPath(parsedExperienceId));
  }

  const result = await syncExperienceOrderPayment({
    orderId: parsedOrderId,
    clerkUserId: authContext.user.id,
    paymentIntentId,
  });

  if (!result) {
    redirect(buildDashboardExperienceCheckoutPath(parsedExperienceId));
  }

  const statusContent = getStatusContent(result.orderStatus);

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Order #{result.orderId}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {statusContent.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {statusContent.body}
          </p>

          <div
            className={`mt-6 rounded-2xl px-4 py-4 text-sm font-medium ${statusContent.tone}`}
          >
            {result.paymentStatus
              ? `Payment status: ${result.paymentStatus}`
              : 'Payment status is not available yet.'}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Experience
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {result.experienceTitle ?? 'Experience'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {result.providerLabel ?? 'Provider'}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Total Paid
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {formatCadAmount(result.totalAmountCad)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Method: {result.paymentMethod ?? 'Stripe'}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Schedule Date
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {result.scheduleDate
                  ? new Date(result.scheduleDate).toLocaleString('en-CA')
                  : 'Not set'}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Customer Email
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {result.customerEmail ?? 'Not available'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={DASHBOARD_EXPERIENCES_PATH}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to experiences
            </Link>
            <Link
              href={buildDashboardExperienceCheckoutPath(parsedExperienceId)}
              className="inline-flex items-center justify-center rounded-full bg-magenta px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-deep"
            >
              Review this booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
