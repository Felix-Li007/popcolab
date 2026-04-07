import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { syncEventOrderPayment } from '@/services/order-service';

type SearchParamsInput = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ eventId: string }>;
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
    case 'PAID':
      return {
        title: 'Payment received',
        tone: 'bg-emerald-50 text-emerald-800',
        body: 'Your event booking has been paid successfully.',
      };
    case 'PROCESSING':
      return {
        title: 'Payment processing',
        tone: 'bg-amber-50 text-amber-800',
        body: 'Stripe is still processing the payment. Please refresh in a moment if needed.',
      };
    case 'PAYMENT_FAILED':
      return {
        title: 'Payment needs attention',
        tone: 'bg-rose-50 text-rose-800',
        body: 'The payment was not completed. You can return to event checkout and try again.',
      };
    case 'CANCELED':
      return {
        title: 'Payment canceled',
        tone: 'bg-gray-100 text-gray-700',
        body: 'The payment was canceled before completion.',
      };
    default:
      return {
        title: 'Booking reserved',
        tone: 'bg-sky-50 text-sky-800',
        body: 'Your order exists, but the payment is not complete yet.',
      };
  }
}

export default async function EventCheckoutResultPage({
  params,
  searchParams,
}: Readonly<PageProps>) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    redirect('/sign-in');
  }

  const { eventId } = await params;
  const parsedEventId = Number(eventId);
  const resolvedSearchParams: SearchParamsInput = searchParams
    ? await searchParams
    : {};
  const parsedOrderId = Number(getFirstValue(resolvedSearchParams.orderId));
  const paymentIntentId = getFirstValue(resolvedSearchParams.payment_intent);

  if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
    redirect('/dashboard/events');
  }

  if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
    redirect(`/dashboard/events/${parsedEventId}/checkout`);
  }

  const result = await syncEventOrderPayment({
    orderId: parsedOrderId,
    clerkUserId: authContext.user.id,
    paymentIntentId,
  });

  if (!result) {
    redirect(`/dashboard/events/${parsedEventId}/checkout`);
  }

  const statusContent = getStatusContent(result.orderStatus);

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
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

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/events"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to events
            </Link>
            <Link
              href="/dashboard/bookings"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 px-5 py-3 text-sm font-bold text-white transition hover:brightness-105"
            >
              Review this booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
