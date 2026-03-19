'use client';

import { startTransition, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createExperienceCheckoutAction } from '@/actions/stripe-actions';
import { Button, Input } from '@/ui';
import { formatCadAmount } from '@/utils/experience';
import { buildDashboardExperienceCheckoutResultPath } from '@/utils/url-helper';

type CheckoutQuote = {
  currency: 'CAD';
  requestedHours: number;
  includedHours: number | null;
  extraHours: number;
  baseAmountCad: number;
  extraAmountCad: number;
  totalAmountCad: number;
};

type ExperienceCheckoutClientProps = {
  publishableKey: string;
  experience: {
    id: number;
    categoryTitle: string;
    experienceTitle: string;
    providerLabel: string;
    durationMin: number;
    durationMax: number;
    pricing: {
      startingPrice: number | null;
      addingPrice: number | null;
      startingHour: number | null;
      pricingModel: string | null;
      pricingNotes: string | null;
    };
  };
  defaultRequestedHours: number;
  minRequestedHours: number;
};

type PreparedCheckout = {
  orderId: number;
  paymentId: number;
  paymentIntentId: string;
  clientSecret: string;
  expiresAt: string;
  quote: CheckoutQuote;
};

const stripePromiseCache = new Map<string, ReturnType<typeof loadStripe>>();

function getStripePromise(publishableKey: string) {
  const existing = stripePromiseCache.get(publishableKey);
  if (existing) return existing;

  const created = loadStripe(publishableKey);
  stripePromiseCache.set(publishableKey, created);
  return created;
}

function createInitialScheduleValue() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  date.setHours(10);

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDuration(durationMin: number, durationMax: number): string {
  if (durationMin === durationMax) {
    return `${durationMin} min`;
  }

  return `${durationMin}-${durationMax} min`;
}

function getLocalQuotePreview(params: {
  startingPrice: number | null;
  addingPrice: number | null;
  includedHours: number | null;
  requestedHours: number;
}): CheckoutQuote | null {
  if (params.startingPrice === null || params.addingPrice === null) {
    return null;
  }

  const minimumHours = params.includedHours ?? 1;
  const requestedHours = Math.max(params.requestedHours, minimumHours);
  const extraHours =
    params.includedHours === null
      ? 0
      : Math.max(0, requestedHours - params.includedHours);
  const extraAmountCad = extraHours * params.addingPrice;

  return {
    currency: 'CAD',
    requestedHours,
    includedHours: params.includedHours,
    extraHours,
    baseAmountCad: params.startingPrice,
    extraAmountCad,
    totalAmountCad: params.startingPrice + extraAmountCad,
  };
}

function PaymentForm({
  experienceId,
  orderId,
  quote,
}: {
  experienceId: number;
  orderId: number;
  quote: CheckoutQuote;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is still loading. Please wait a moment and try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const submitResult = await elements.submit();
    if (submitResult.error) {
      setIsSubmitting(false);
      setError(
        submitResult.error.message ?? 'Please review your payment details.'
      );
      return;
    }

    const returnUrl = `${window.location.origin}${buildDashboardExperienceCheckoutResultPath(experienceId)}?orderId=${orderId}`;
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (result.error) {
      setIsSubmitting(false);
      setError(result.error.message ?? 'Unable to confirm your payment.');
      return;
    }

    if (result.paymentIntent) {
      const query = new URLSearchParams({
        orderId: String(orderId),
        payment_intent: result.paymentIntent.id,
      });

      startTransition(() => {
        router.push(
          `${buildDashboardExperienceCheckoutResultPath(experienceId)}?${query.toString()}`
        );
      });
    }
  }

  return (
    <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Payment
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Complete your booking
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Your card details are processed securely by Stripe.
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Total
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatCadAmount(quote.totalAmountCad)}
          </p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <PaymentElement />

        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          size="md"
          disabled={!stripe || !elements || isSubmitting}
        >
          {isSubmitting
            ? 'Processing...'
            : `Pay ${formatCadAmount(quote.totalAmountCad)}`}
        </Button>
      </form>
    </div>
  );
}

export default function ExperienceCheckoutClient({
  publishableKey,
  experience,
  defaultRequestedHours,
  minRequestedHours,
}: ExperienceCheckoutClientProps) {
  const [requestedHours, setRequestedHours] = useState(
    String(defaultRequestedHours)
  );
  const [scheduleDate, setScheduleDate] = useState(
    createInitialScheduleValue()
  );
  const [preparedCheckout, setPreparedCheckout] =
    useState<PreparedCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const stripePromise = useMemo(
    () => getStripePromise(publishableKey),
    [publishableKey]
  );

  const requestedHoursNumber = Number.parseInt(requestedHours, 10);
  const previewQuote = getLocalQuotePreview({
    startingPrice: experience.pricing.startingPrice,
    addingPrice: experience.pricing.addingPrice,
    includedHours: experience.pricing.startingHour,
    requestedHours: Number.isInteger(requestedHoursNumber)
      ? requestedHoursNumber
      : defaultRequestedHours,
  });

  function resetPreparedCheckout() {
    setPreparedCheckout(null);
  }

  async function handlePrepareCheckout(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const parsedRequestedHours = Number.parseInt(requestedHours, 10);
    if (
      !Number.isInteger(parsedRequestedHours) ||
      parsedRequestedHours < minRequestedHours
    ) {
      setError(`Requested hours must be at least ${minRequestedHours}.`);
      return;
    }

    if (!scheduleDate) {
      setError('Please choose a schedule date.');
      return;
    }

    const scheduleDateIso = new Date(scheduleDate);
    if (Number.isNaN(scheduleDateIso.getTime())) {
      setError('Please choose a valid schedule date.');
      return;
    }

    setIsPreparing(true);
    setError(null);

    try {
      const payload = await createExperienceCheckoutAction({
        experienceId: experience.id,
        requestedHours: parsedRequestedHours,
        scheduleDate: scheduleDateIso.toISOString(),
      });

      setPreparedCheckout(payload);
    } catch (checkoutError) {
      setPreparedCheckout(null);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Unable to start checkout.'
      );
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Booking
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {experience.experienceTitle}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {experience.categoryTitle} by {experience.providerLabel}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Duration
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDuration(experience.durationMin, experience.durationMax)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Starting Price
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatCadAmount(experience.pricing.startingPrice)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Add-on Price
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatCadAmount(experience.pricing.addingPrice)}
              </p>
            </div>
          </div>

          {experience.pricing.pricingModel ? (
            <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Pricing Model
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {experience.pricing.pricingModel}
              </p>
            </div>
          ) : null}

          {experience.pricing.pricingNotes ? (
            <div className="mt-3 rounded-2xl bg-teal-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
                Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-teal-950">
                {experience.pricing.pricingNotes}
              </p>
            </div>
          ) : null}
        </div>

        <form
          className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={handlePrepareCheckout}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Booking Details
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Choose your schedule and hours
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Changing these details will refresh the payment form.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Input
              label="Schedule Date"
              type="datetime-local"
              value={scheduleDate}
              min={createInitialScheduleValue()}
              onChange={event => {
                setScheduleDate(event.target.value);
                resetPreparedCheckout();
              }}
            />
            <Input
              label="Requested Hours"
              type="number"
              min={String(minRequestedHours)}
              step="1"
              value={requestedHours}
              helperText={
                experience.pricing.startingHour !== null
                  ? `Minimum ${minRequestedHours} hours`
                  : 'Whole hours only'
              }
              onChange={event => {
                setRequestedHours(event.target.value);
                resetPreparedCheckout();
              }}
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" size="md" disabled={isPreparing}>
              {isPreparing
                ? 'Preparing payment...'
                : 'Load secure payment form'}
            </Button>
            {preparedCheckout ? (
              <span className="text-xs font-medium text-gray-500">
                Order #{preparedCheckout.orderId} reserved until{' '}
                {new Date(preparedCheckout.expiresAt).toLocaleString('en-CA')}
              </span>
            ) : null}
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Summary
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Estimated total
          </h2>

          {previewQuote ? (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <span>Base price</span>
                <strong className="text-gray-900">
                  {formatCadAmount(previewQuote.baseAmountCad)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <span>
                  Extra hours
                  {previewQuote.extraHours > 0
                    ? ` (${previewQuote.extraHours} x ${formatCadAmount(
                        experience.pricing.addingPrice
                      )})`
                    : ''}
                </span>
                <strong className="text-gray-900">
                  {formatCadAmount(previewQuote.extraAmountCad)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-teal-50 px-4 py-4">
                <span className="text-sm font-semibold text-teal-900">
                  Total
                </span>
                <strong className="text-xl text-teal-950">
                  {formatCadAmount(previewQuote.totalAmountCad)}
                </strong>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Pricing is not fully configured for this experience.
            </p>
          )}
        </div>

        {preparedCheckout ? (
          <Elements
            key={preparedCheckout.clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret: preparedCheckout.clientSecret,
              appearance: {
                variables: {
                  colorPrimary: '#0f766e',
                  borderRadius: '16px',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                },
              },
            }}
          >
            <PaymentForm
              experienceId={experience.id}
              orderId={preparedCheckout.orderId}
              quote={preparedCheckout.quote}
            />
          </Elements>
        ) : (
          <div className="rounded-[30px] border border-dashed border-gray-300 bg-white/80 p-8 text-center text-sm text-gray-500">
            Load the payment form after choosing your booking details.
          </div>
        )}
      </div>
    </div>
  );
}
