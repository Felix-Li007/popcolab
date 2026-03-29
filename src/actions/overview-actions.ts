'use server';

import { getEventById } from '@/services/event-service';

export async function getOverviewEventByIdAction(id: number) {
  return getEventById(id);
}
