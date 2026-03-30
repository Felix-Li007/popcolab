import { notFound } from 'next/navigation';
import { EventEditorPage } from '@/components/admin/event/event-form';
import { getEventById } from '@/services/event-service';

type EditEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEventPage({
  params,
}: Readonly<EditEventPageProps>) {
  const resolvedParams = await params;
  const eventId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(eventId)) {
    notFound();
  }

  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }

  return <EventEditorPage event={event} />;
}
