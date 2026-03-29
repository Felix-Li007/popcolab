import { Suspense } from 'react';
import EventContent from '@/components/admin/event/event-content';
import { getEvents, type EventSearchFilters } from '@/services/event-service';

type SearchParamsInput = Record<string, string | string[] | undefined>;

type EventsPageProps = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

function isEventStatus(
  value: string | undefined
): value is EventSearchFilters['status'] {
  return (
    value === 'ACTIVE' ||
    value === 'INACTIVE' ||
    value === 'DRAFT' ||
    value === 'all'
  );
}

function getSearchParam(searchParams: SearchParamsInput, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function EventsPage({
  searchParams,
}: Readonly<EventsPageProps>) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawStatus = getSearchParam(resolvedSearchParams, 'status');
  const initialFilters: EventSearchFilters = {
    keyword: getSearchParam(resolvedSearchParams, 'q') ?? '',
    status: isEventStatus(rawStatus) ? rawStatus : 'all',
    priceMin: getSearchParam(resolvedSearchParams, 'priceMin') ?? '',
    priceMax: getSearchParam(resolvedSearchParams, 'priceMax') ?? '',
    dateTimeStart: getSearchParam(resolvedSearchParams, 'dateTimeStart') ?? '',
    dateTimeEnd: getSearchParam(resolvedSearchParams, 'dateTimeEnd') ?? '',
  };

  const events = await getEvents(initialFilters);

  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <EventContent
        key={JSON.stringify(initialFilters)}
        initialData={events}
        initialFilters={initialFilters}
      />
    </Suspense>
  );
}
