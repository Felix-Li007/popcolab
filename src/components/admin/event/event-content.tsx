'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EventStatus } from '@/libs/prisma/enums';
import { Button } from '@/ui';
import AdminEmptyState from '@/components/admin/common/admin-empty-state';
import PaginationBar from '@/components/shared/pagination-bar';
import DatePicker from '@/components/shared/date-picker';
import EventCard from '@/components/admin/event/event-card';
import EventForm from '@/components/admin/event/event-form';
import EventView from '@/components/admin/event/event-view';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { deleteEventAction } from '@/actions/event-actions';
import type { Event } from '@/types/event-type';
import type { EventSearchFilters } from '@/services/event-service';
import {
  formatScheduleTimeValue,
  mergeDateAndTime,
  parseCalendarDateValue,
} from '@/utils/event-schedule';
import styles from '@/styles/admin/events/event-content.module.css';

type Props = {
  initialData: Event[];
  initialFilters: EventSearchFilters;
};

type StatusFilter = 'all' | Event['eventStatus'];

function getEventStartTimestamp(event: Event) {
  const timestamps = (event.event_calendars ?? [])
    .flatMap(calendar => {
      const eventDate = parseCalendarDateValue(calendar.event_date);
      const startTime = formatScheduleTimeValue(calendar.start_time);

      if (!eventDate || !startTime) {
        return [];
      }

      return [mergeDateAndTime(eventDate, startTime).getTime()];
    })
    .filter(timestamp => Number.isFinite(timestamp));

  if (timestamps.length === 0) return null;
  return Math.min(...timestamps);
}

function getLastEventEndTimestamp(event: Event) {
  const timestamps = (event.event_calendars ?? [])
    .flatMap(calendar => {
      const eventDate = parseCalendarDateValue(calendar.event_date);
      const endTime = formatScheduleTimeValue(calendar.end_time);

      if (!eventDate || !endTime) {
        return [];
      }

      return [mergeDateAndTime(eventDate, endTime).getTime()];
    })
    .filter(timestamp => Number.isFinite(timestamp));

  if (timestamps.length === 0) return null;
  return Math.max(...timestamps);
}

function isUpcomingEvent(event: Event) {
  const lastEventEndTimestamp = getLastEventEndTimestamp(event);
  if (lastEventEndTimestamp === null) return false;
  return lastEventEndTimestamp >= Date.now();
}

function buildEventSearchHref(filters: {
  keyword: string;
  status: StatusFilter;
  priceMin: string;
  priceMax: string;
  dateTimeStart: string;
  dateTimeEnd: string;
}) {
  const params = new URLSearchParams();
  const keyword = filters.keyword.trim();

  if (keyword) params.set('q', keyword);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.priceMin.trim()) params.set('priceMin', filters.priceMin.trim());
  if (filters.priceMax.trim()) params.set('priceMax', filters.priceMax.trim());
  if (filters.dateTimeStart.trim()) {
    params.set('dateTimeStart', filters.dateTimeStart.trim());
  }
  if (filters.dateTimeEnd.trim()) {
    params.set('dateTimeEnd', filters.dateTimeEnd.trim());
  }

  const query = params.toString();
  return query ? `/admin/events?${query}` : '/admin/events';
}

export default function EventContent({
  initialData,
  initialFilters,
}: Readonly<Props>) {
  type PanelMode = 'create' | 'edit' | 'view' | null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keywordInput, setKeywordInput] = useState(
    initialFilters.keyword ?? ''
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    initialFilters.status ?? 'all'
  );
  const [priceMin, setPriceMin] = useState(initialFilters.priceMin ?? '');
  const [priceMax, setPriceMax] = useState(initialFilters.priceMax ?? '');
  const [dateTimeStart, setDateTimeStart] = useState(
    initialFilters.dateTimeStart ?? ''
  );
  const [dateTimeEnd, setDateTimeEnd] = useState(
    initialFilters.dateTimeEnd ?? ''
  );
  const [, startDeleteTransition] = useTransition();

  const events = initialData;
  const pageParam = Number(searchParams.get('page') ?? '1');
  const selectedIdParam = searchParams.get('id');
  const modeParam = searchParams.get('mode');
  const [page, setPage] = useState(
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  );
  const selectedId =
    selectedIdParam && selectedIdParam !== 'new'
      ? Number(selectedIdParam)
      : null;
  const panelMode: PanelMode =
    modeParam === 'create' || modeParam === 'edit' || modeParam === 'view'
      ? modeParam
      : null;

  const orderedEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        const leftIsUpcoming = isUpcomingEvent(left);
        const rightIsUpcoming = isUpcomingEvent(right);

        if (leftIsUpcoming !== rightIsUpcoming) {
          return leftIsUpcoming ? -1 : 1;
        }

        const leftStartTimestamp = getEventStartTimestamp(left);
        const rightStartTimestamp = getEventStartTimestamp(right);
        const leftEndTimestamp = getLastEventEndTimestamp(left);
        const rightEndTimestamp = getLastEventEndTimestamp(right);

        if (leftIsUpcoming && rightIsUpcoming) {
          if (leftStartTimestamp !== null && rightStartTimestamp !== null) {
            return leftStartTimestamp - rightStartTimestamp;
          }
          if (leftStartTimestamp !== null) return -1;
          if (rightStartTimestamp !== null) return 1;
        }

        if (!leftIsUpcoming && !rightIsUpcoming) {
          if (leftEndTimestamp !== null && rightEndTimestamp !== null) {
            return rightEndTimestamp - leftEndTimestamp;
          }
          if (leftEndTimestamp !== null) return -1;
          if (rightEndTimestamp !== null) return 1;
        }

        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      }),
    [events]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(orderedEvents.length / DEFAULT_PAGE_SIZE)
  );
  const pageStart = (page - 1) * DEFAULT_PAGE_SIZE;
  const pageEnd = pageStart + DEFAULT_PAGE_SIZE;
  const paginatedEvents = orderedEvents.slice(pageStart, pageEnd);

  const handleSearch = () => {
    setPage(1);
    router.push(
      buildEventSearchHref({
        keyword: keywordInput,
        status: statusFilter,
        priceMin,
        priceMax,
        dateTimeStart,
        dateTimeEnd,
      }),
      { scroll: false }
    );
  };

  const handleClearFilters = () => {
    setKeywordInput('');
    setStatusFilter('all');
    setPriceMin('');
    setPriceMax('');
    setDateTimeStart('');
    setDateTimeEnd('');
    setPage(1);
    router.push('/admin/events', { scroll: false });
  };

  const deleteEventById = async (id: number) => {
    const result = await deleteEventAction(id);
    if (result.success) {
      if (selectedId === id) {
        router.push('/admin/events');
      }
      return;
    }

    alert(result.error || 'Failed to delete event');
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    startDeleteTransition(() => {
      void deleteEventById(id);
    });
  };

  const handleViewEvent = (id: number) => {
    router.replace(`/admin/events?id=${id}&mode=view`, { scroll: false });
  };

  const handleEditEvent = (id: number) => {
    router.replace(`/admin/events?id=${id}&mode=edit`, { scroll: false });
  };

  const handleCreateNew = () => {
    router.replace('/admin/events?id=new&mode=create', { scroll: false });
  };

  const handleCloseForm = () => {
    router.replace('/admin/events', { scroll: false });
  };

  const handleFormSuccess = () => {
    router.refresh();
    handleCloseForm();
  };

  const selectedEvent = selectedId
    ? events.find(event => event.id === selectedId)
    : null;

  return (
    <div className={styles.root}>
      <div className={styles.listSection}>
        <div className={styles.listPanel}>
          <div className={styles.toolbarHeader}>
            <div className={styles.toolbarTitle}>Events ({events.length})</div>
            <Button size="sm" onClick={handleCreateNew}>
              New Event
            </Button>
          </div>

          <div className={styles.toolbarRow}>
            <div className={styles.filterControls}>
              <div className={styles.statusField}>
                <label className={styles.srOnlyLabel} htmlFor="event-status">
                  Status
                </label>
                <select
                  id="event-status"
                  value={statusFilter}
                  onChange={event =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className={styles.filterInput}
                >
                  <option value="all">All Events</option>
                  <option value={EventStatus.ACTIVE}>Active</option>
                  <option value={EventStatus.INACTIVE}>Inactive</option>
                  <option value={EventStatus.DRAFT}>Draft</option>
                </select>
              </div>

              <div className={styles.filterField}>
                <label className={styles.srOnlyLabel} htmlFor="event-price-min">
                  Price Min
                </label>
                <input
                  id="event-price-min"
                  type="number"
                  min="0"
                  step="1"
                  value={priceMin}
                  onChange={event => setPriceMin(event.target.value)}
                  placeholder="0"
                  className={styles.filterInput}
                />
              </div>

              <div className={styles.filterField}>
                <label className={styles.srOnlyLabel} htmlFor="event-price-max">
                  Price Max
                </label>
                <input
                  id="event-price-max"
                  type="number"
                  min="0"
                  step="1"
                  value={priceMax}
                  onChange={event => setPriceMax(event.target.value)}
                  placeholder="999"
                  className={styles.filterInput}
                />
              </div>

              <DatePicker
                id="event-datetime-start"
                ariaLabel="Date Start"
                value={dateTimeStart}
                onChange={setDateTimeStart}
                placeholder="mmm d, yyyy, h:mm am"
                defaultTime="00:00"
              />

              <DatePicker
                id="event-datetime-end"
                ariaLabel="Date End"
                value={dateTimeEnd}
                onChange={setDateTimeEnd}
                placeholder="mmm d, yyyy, h:mm am"
                defaultTime="23:59"
              />

              <div className={styles.keywordField}>
                <label className={styles.srOnlyLabel} htmlFor="event-keyword">
                  Search
                </label>
                <div className={styles.keywordRow}>
                  <input
                    id="event-keyword"
                    type="text"
                    value={keywordInput}
                    onChange={event => setKeywordInput(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Search title or address..."
                    className={styles.filterInput}
                  />
                  <button
                    type="button"
                    className={styles.searchButton}
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={styles.filterButton}
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>
          </div>

          <div className={styles.listBody}>
            {events.length === 0 ? (
              <AdminEmptyState
                emoji="📅"
                message="No events found. Create your first event to get started."
              />
            ) : (
              <>
                <div className={styles.cardsGrid}>
                  {paginatedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isEditingSelected={selectedId === event.id}
                      onView={() => handleViewEvent(event.id)}
                      onEdit={() => handleEditEvent(event.id)}
                      onDelete={() => handleDelete(event.id)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    variant="dashboard"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <EventForm
        isOpen={panelMode === 'create' || panelMode === 'edit'}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        event={panelMode === 'edit' ? (selectedEvent ?? undefined) : undefined}
      />
      <EventView
        isOpen={panelMode === 'view' && Boolean(selectedEvent)}
        onClose={handleCloseForm}
        event={selectedEvent ?? undefined}
      />
    </div>
  );
}
