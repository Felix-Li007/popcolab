import { notFound } from 'next/navigation';
import { EventViewPage } from '@/components/admin/event/event-view';
import { getEventById } from '@/services/event-service';

type EventDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailPage({
  params,
}: Readonly<EventDetailPageProps>) {
  const resolvedParams = await params;
  const eventId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(eventId)) {
    notFound();
  }

  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }

  return <EventViewPage event={event} />;
}
