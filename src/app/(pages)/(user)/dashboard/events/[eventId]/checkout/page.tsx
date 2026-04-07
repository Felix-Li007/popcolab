import { redirect } from 'next/navigation';
import EventCheckoutClient from '@/components/dashboard/event-checkout-client';
import { getStripePublishableKey } from '@/libs/stripe-server';
import { getCurrentAuthContext } from '@/services/clerk-service';

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventCheckoutPage({
  params,
}: Readonly<PageProps>) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    redirect('/sign-in');
  }

  const { eventId } = await params;
  const parsedEventId = Number(eventId);
  if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
    redirect('/dashboard/events');
  }

  const publishableKey = getStripePublishableKey();

  return (
    <EventCheckoutClient
      publishableKey={publishableKey}
      eventId={parsedEventId}
    />
  );
}
