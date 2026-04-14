'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  createEventPaymentIntentAction,
  syncEventOrderPaymentAction,
  type CreatedEventPaymentIntent,
} from '@/actions/stripe-actions';
import {
  createOrUpdateBookingAction,
  getEventByIdAction,
} from '@/actions/event-actions';
import {
  formatLocalDateValue,
  formatScheduleTimeValue,
  parseCalendarDateValue,
} from '@/utils/event-schedule';

type Ticket = {
  priceId: number;
  name: string;
  qty: number;
  price: number;
};

type EventCalendar = {
  id: number;
  event_date: string | Date;
  start_time: string | Date;
  end_time: string | Date;
  date_status?: string | null;
};

type EventPricing = {
  id: number;
  price_level: string;
  event_price: number | string;
};

type EventDetails = {
  id: number;
  eventTitle: string;
  eventLocation: string;
  eventNotes?: string | null;
  event_calendars?: EventCalendar[];
  event_pricing?: EventPricing[];
};

type BookingData = {
  eventId: number;
  calendarId: number;
  title?: string;
  location?: string;
  date: string;
  tickets: Ticket[];
  quantity: number;
  total: number;
};

type EventCheckoutClientProps = {
  publishableKey: string;
  eventId: number;
};

const stripePromiseCache = new Map<string, ReturnType<typeof loadStripe>>();

function getStripePromise(publishableKey: string) {
  const existing = stripePromiseCache.get(publishableKey);
  if (existing) return existing;

  const created = loadStripe(publishableKey);
  stripePromiseCache.set(publishableKey, created);
  return created;
}

function EventPaymentForm({
  data,
  checkout,
}: Readonly<{
  data: BookingData;
  checkout: CreatedEventPaymentIntent;
}>) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultBasePath = `/dashboard/events/${data.eventId}/checkout/result`;

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

    const returnUrl = `${globalThis.location.origin}${resultBasePath}?orderId=${checkout.orderId}`;
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

    try {
      await syncEventOrderPaymentAction({
        orderId: checkout.orderId,
        paymentIntentId: result.paymentIntent?.id ?? checkout.paymentIntentId,
      });
    } catch (syncError) {
      setIsSubmitting(false);
      setError(
        syncError instanceof Error
          ? syncError.message
          : 'Payment succeeded, but order sync failed.'
      );
      return;
    }

    try {
      await createOrUpdateBookingAction({
        eventId: data.eventId,
        calendarId: data.calendarId,
        quantity: data.quantity,
        total: data.total,
        tickets: data.tickets.map(ticket => ({
          priceId: ticket.priceId,
          qty: ticket.qty,
        })),
      });

      const query = new URLSearchParams({
        orderId: String(checkout.orderId),
      });

      if (result.paymentIntent?.id) {
        query.set('payment_intent', result.paymentIntent.id);
      }

      router.push(`${resultBasePath}?${query.toString()}`);
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : 'Payment succeeded, but booking creation failed.'
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mt-6 space-y-4 rounded-[1.9rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,254,255,0.84))] p-5 shadow-[0_22px_54px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-teal-deep/70">
          Secure payment
        </p>
        <h3 className="mt-2 font-museo text-[1.05rem] font-bold text-slate-900">
          Complete your checkout
        </h3>
      </div>

      <PaymentElement />

      {error ? (
        <div className="rounded-[1.25rem] border border-rose-200/70 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 shadow-[0_10px_22px_rgba(244,63,94,0.08)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="mt-2 w-full rounded-full bg-pink-medium py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(219,39,119,0.22)] transition hover:-translate-y-px hover:bg-magenta disabled:opacity-50"
      >
        {isSubmitting ? 'Processing...' : `Pay $${data.total}`}
      </button>
    </form>
  );
}

export default function EventCheckoutClient({
  publishableKey,
  eventId,
}: Readonly<EventCheckoutClientProps>) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(
    null
  );
  const [ticketQty, setTicketQty] = useState<Record<number, number>>({});
  const [data, setData] = useState<BookingData | null>(null);
  const [paymentIntent, setPaymentIntent] =
    useState<CreatedEventPaymentIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const stripePromise = useMemo(
    () => getStripePromise(publishableKey),
    [publishableKey]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadEvent = async () => {
      try {
        const response = (await getEventByIdAction(
          eventId
        )) as EventDetails | null;
        if (!response) {
          throw new Error('Event not found.');
        }

        const activeCalendars =
          response.event_calendars?.filter(
            calendar => calendar.date_status !== 'CANCELLED'
          ) ?? [];

        if (activeCalendars.length === 0) {
          throw new Error('No event dates are currently available.');
        }

        const initialTicketQty = Object.fromEntries(
          (response.event_pricing ?? []).map(pricing => [pricing.id, 0])
        );

        if (!isCancelled) {
          setEvent(response);
          setSelectedCalendarId(activeCalendars[0]?.id ?? null);
          setTicketQty(initialTicketQty);
          setError(null);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load event checkout.'
          );
        }
      }
    };

    void loadEvent();

    return () => {
      isCancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    setData(null);
    setPaymentIntent(null);
    setError(null);
  }, [selectedCalendarId, ticketQty]);

  if (error && !event) {
    return <p className="p-6 text-rose-600">{error}</p>;
  }

  if (!event) {
    return <p className="p-6">Loading...</p>;
  }

  const activeCalendars =
    event.event_calendars?.filter(
      calendar => calendar.date_status !== 'CANCELLED'
    ) ?? [];
  const selectedCalendar =
    activeCalendars.find(calendar => calendar.id === selectedCalendarId) ??
    null;
  const selectedDate =
    selectedCalendar &&
    (typeof selectedCalendar.event_date === 'string'
      ? selectedCalendar.event_date
      : selectedCalendar.event_date.toISOString());
  const selectedDateLabel = selectedCalendar
    ? formatLocalDateValue(
        parseCalendarDateValue(selectedCalendar.event_date) ?? new Date()
      )
    : 'Not selected';
  const selectedTickets = (event.event_pricing ?? [])
    .filter(pricing => (ticketQty[pricing.id] ?? 0) > 0)
    .map(pricing => ({
      priceId: pricing.id,
      name: pricing.price_level,
      qty: ticketQty[pricing.id] ?? 0,
      price: Number(pricing.event_price),
    }));
  const quantity = selectedTickets.reduce((sum, ticket) => sum + ticket.qty, 0);
  const total = selectedTickets.reduce(
    (sum, ticket) => sum + ticket.qty * ticket.price,
    0
  );

  function updateQty(priceId: number, type: 'inc' | 'dec') {
    setTicketQty(prev => ({
      ...prev,
      [priceId]:
        type === 'inc'
          ? (prev[priceId] ?? 0) + 1
          : Math.max(0, (prev[priceId] ?? 0) - 1),
    }));
  }

  async function handlePrepareCheckout() {
    if (!event) {
      setError('Event details are still loading.');
      return;
    }

    if (!selectedCalendar || !selectedDate) {
      setError('Please choose an event date.');
      return;
    }

    if (selectedTickets.length === 0) {
      setError('Please select at least one ticket.');
      return;
    }

    const nextData: BookingData = {
      eventId: event.id,
      calendarId: selectedCalendar.id,
      title: event.eventTitle,
      location: event.eventLocation,
      date: selectedDate,
      tickets: selectedTickets,
      quantity,
      total,
    };

    setIsPreparing(true);
    setError(null);

    try {
      const payload = await createEventPaymentIntentAction({
        eventId: nextData.eventId,
        calendarId: nextData.calendarId,
        quantity: nextData.quantity,
        total: nextData.total,
        tickets: nextData.tickets.map(ticket => ({
          priceId: ticket.priceId,
          qty: ticket.qty,
        })),
      });

      setData(nextData);
      setPaymentIntent(payload);
    } catch (prepareError) {
      setData(null);
      setPaymentIntent(null);
      setError(
        prepareError instanceof Error
          ? prepareError.message
          : 'Unable to initialize payment.'
      );
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <div className="grid gap-6 px-2 py-3 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,252,255,0.84))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-deep/70">
            Booking
          </p>
          <h1 className="mt-2 font-museo text-[1.35rem] font-bold tracking-[-0.03em] text-slate-900">
            {event.eventTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{event.eventLocation}</p>
          {event.eventNotes ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {event.eventNotes}
            </p>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,254,255,0.84))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-deep/70">
            Booking Details
          </p>
          <h2 className="mt-2 font-museo text-[1.05rem] font-bold text-slate-900">
            Choose your event date and tickets
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Changing these details will refresh the payment form.
          </p>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">Event Date</p>
            <div className="mt-3 space-y-3">
              {activeCalendars.map(calendar => {
                const parsedDate = parseCalendarDateValue(calendar.event_date);
                const dateLabel = parsedDate
                  ? formatLocalDateValue(parsedDate)
                  : 'Invalid date';
                const startLabel =
                  formatScheduleTimeValue(calendar.start_time) ||
                  'Invalid time';
                const endLabel =
                  formatScheduleTimeValue(calendar.end_time) || 'Invalid time';

                return (
                  <button
                    key={calendar.id}
                    type="button"
                    onClick={() => setSelectedCalendarId(calendar.id)}
                    className={`w-full rounded-[1.5rem] border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition ${
                      selectedCalendarId === calendar.id
                        ? 'border-pink-medium bg-[linear-gradient(135deg,rgba(253,242,248,0.92),rgba(255,255,255,0.84))]'
                        : 'border-white/75 bg-white/76 hover:bg-white/88'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{dateLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {startLabel} - {endLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">Tickets</p>
            <div className="mt-3 space-y-3">
              {(event.event_pricing ?? []).map(pricing => {
                const qty = ticketQty[pricing.id] ?? 0;
                return (
                  <div
                    key={pricing.id}
                    className={`flex items-center justify-between rounded-[1.5rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition ${
                      qty > 0
                        ? 'border-pink-medium bg-[linear-gradient(135deg,rgba(253,242,248,0.92),rgba(255,255,255,0.84))]'
                        : 'border-white/75 bg-white/76 hover:bg-white/88'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {pricing.price_level}
                      </p>
                      <p className="mt-1 text-sm text-pink-600">
                        ${Number(pricing.event_price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateQty(pricing.id, 'dec')}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/82 bg-white/84 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl transition hover:bg-white"
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center font-semibold text-slate-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(pricing.id, 'inc')}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/82 bg-white/84 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl transition hover:bg-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[1.4rem] border border-rose-200/70 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 shadow-[0_10px_22px_rgba(244,63,94,0.08)]">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrepareCheckout}
              disabled={isPreparing}
              className="rounded-full bg-pink-medium px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(219,39,119,0.22)] transition hover:-translate-y-px hover:bg-magenta disabled:opacity-60"
            >
              {isPreparing
                ? 'Preparing payment...'
                : 'Load secure payment form'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,254,255,0.84))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-deep/70">
            Summary
          </p>
          <h2 className="mt-2 font-museo text-[1.05rem] font-bold text-slate-900">
            Estimated total
          </h2>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-[1.4rem] border border-white/76 bg-white/76 px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl">
              <span>Event Date</span>
              <strong className="text-slate-900">{selectedDateLabel}</strong>
            </div>

            <div className="rounded-[1.4rem] border border-white/76 bg-white/76 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl">
              <p className="text-sm font-semibold text-slate-900">Tickets</p>
              {selectedTickets.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {selectedTickets.map(ticket => (
                    <div
                      key={ticket.priceId}
                      className="flex items-center justify-between text-sm text-slate-700"
                    >
                      <span>
                        {ticket.name} x {ticket.qty}
                      </span>
                      <strong className="text-slate-900">
                        ${ticket.qty * ticket.price}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select tickets to see your total.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-[1.5rem] border border-white/76 bg-[linear-gradient(135deg,rgba(253,242,248,0.92),rgba(255,255,255,0.84))] px-4 py-4 shadow-[0_12px_28px_rgba(219,39,119,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl">
              <span className="text-sm font-semibold text-pink-900">Total</span>
              <strong className="text-xl text-pink-950">${total}</strong>
            </div>
          </div>
        </div>

        {!data || isPreparing || !paymentIntent ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/82 p-8 text-center text-sm text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.04)] backdrop-blur-xl">
            Load the payment form after choosing your booking details.
          </div>
        ) : (
          <Elements
            key={paymentIntent.clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret: paymentIntent.clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <EventPaymentForm data={data} checkout={paymentIntent} />
          </Elements>
        )}
      </div>
    </div>
  );
}
