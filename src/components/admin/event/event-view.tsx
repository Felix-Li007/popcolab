'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DateStatus } from '@/libs/prisma/enums';
import ModalShell from '@/components/shared/modal-shell';
import { Button } from '@/ui';
import EventGalleryPanel from '@/components/admin/event/event-gallery';
import EventPricingPanel from '@/components/admin/event/event-pricing';
import TimeSectionPanel from '@/components/admin/event/event-time';
import {
  cancelEventAction,
  cancelEventCalendarAction,
} from '@/actions/event-actions';
import type { Event } from '@/types/event-type';
import styles from '@/styles/admin/events/event-form.module.css';
import pageStyles from '@/styles/admin/events/event-page.module.css';
import { sanitizeRichTextHtml } from '@/utils/html-sanitizer';
import { EVENT_CANCEL_MIN_LEAD_DAYS } from '@/constants/event-config';
import {
  isAtLeastDaysAway,
  mergeDateAndTime,
  parseCalendarDateValue,
  formatScheduleTimeValue,
} from '@/utils/event-schedule';

const SECTION_TABS = ['ABOUT', 'TIME', 'GALLERY', 'PRICING'] as const;
type SectionTab = (typeof SECTION_TABS)[number];

type DraftSchedule = {
  id: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
};

type PageProps = {
  event: Event;
};

function canCancelSchedule(schedule: { eventDate: Date; startTime: string }) {
  return isAtLeastDaysAway(
    mergeDateAndTime(schedule.eventDate, schedule.startTime),
    EVENT_CANCEL_MIN_LEAD_DAYS
  );
}

function getInitialDraftSchedules(event?: Event): DraftSchedule[] {
  return (event?.event_calendars ?? [])
    .filter(calendar => calendar.date_status !== DateStatus.CANCELLED)
    .flatMap(calendar => {
      const eventDate = parseCalendarDateValue(calendar.event_date);
      if (!eventDate) return [];

      return [
        {
          id: `calendar-${calendar.id}`,
          eventDate,
          startTime: formatScheduleTimeValue(calendar.start_time),
          endTime: formatScheduleTimeValue(calendar.end_time),
        },
      ];
    });
}
function getInitialDraftSchedule(event?: Event): DraftSchedule {
  return (
    getInitialDraftSchedules(event)[0] ?? {
      startTime: '',
      endTime: '',
    }
  );
}

function useEventViewState(event: Event) {
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('ABOUT');
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(
    event.event_calendars?.[0]?.id ?? null
  );
  const draftSchedules = useMemo(
    () => getInitialDraftSchedules(event),
    [event]
  );
  const [selectedDraftScheduleId, setSelectedDraftScheduleId] = useState<
    string | null
  >(draftSchedules[0]?.id ?? null);
  const [draftSchedule, setDraftSchedule] = useState<DraftSchedule>(() =>
    getInitialDraftSchedule(event)
  );

  const calendars = useMemo(
    (): NonNullable<Event['event_calendars']> =>
      [...(event.event_calendars ?? [])]
        .filter(calendar => calendar.date_status !== DateStatus.CANCELLED)
        .sort((left, right) => {
          const leftDate = parseCalendarDateValue(left.event_date);
          const rightDate = parseCalendarDateValue(right.event_date);
          const leftTime = leftDate?.getTime() ?? 0;
          const rightTime = rightDate?.getTime() ?? 0;
          if (leftTime !== rightTime) return leftTime - rightTime;
          return formatScheduleTimeValue(left.start_time).localeCompare(
            formatScheduleTimeValue(right.start_time)
          );
        }),
    [event.event_calendars]
  );

  const sanitizedContentHtml = sanitizeRichTextHtml(event.contentHtml);
  const selectedDraftSchedule = draftSchedules.find(
    schedule => schedule.id === selectedDraftScheduleId
  );

  const aboutSectionContent = (
    <div className={styles.aboutSectionPanel}>
      <div className={styles.formGroup}>
        <div className={`${styles.editor} ${styles.viewEditor}`}>
          <div
            className={styles.editorBody}
            dangerouslySetInnerHTML={{ __html: sanitizedContentHtml }}
          />
        </div>
      </div>
    </div>
  );

  const timeSectionContent = (
    <TimeSectionPanel
      calendars={calendars}
      selectedCalendarId={selectedCalendarId}
      onSelectCalendar={setSelectedCalendarId}
      isEditable={false}
      useEditableLayout={true}
      allowScheduleSelectionWhenReadOnly={true}
      showActionButtons={false}
      draftDate={draftSchedule.eventDate}
      draftStartTime={draftSchedule.startTime}
      draftEndTime={draftSchedule.endTime}
      draftSchedules={draftSchedules}
      selectedDraftScheduleId={selectedDraftScheduleId}
      onDraftDateChange={() => {}}
      onDraftStartTimeChange={() => {}}
      onDraftEndTimeChange={() => {}}
      usePageLayout={true}
      onSelectDraftSchedule={scheduleId => {
        const selectedDraft = draftSchedules.find(
          schedule => schedule.id === scheduleId
        );

        if (!selectedDraft) return;

        setSelectedDraftScheduleId(scheduleId);
        setDraftSchedule({
          ...selectedDraft,
          eventDate: new Date(selectedDraft.eventDate),
        });
      }}
      onAddDraftSchedule={() => {}}
      onDeleteDraftSchedule={() => {}}
    />
  );

  const notesField = (
    <div className={`${styles.formGroup} ${pageStyles.notesField}`}>
      <textarea
        id="eventNotesView"
        value={event.eventNotes ?? ''}
        readOnly
        disabled
        rows={3}
        className={`${styles.textarea} ${styles.viewField} ${pageStyles.notesTextarea}`}
      />
    </div>
  );

  const pageSectionContent = (
    <div className={pageStyles.sectionStack}>
      <div className={pageStyles.topSectionGrid}>
        <section className={pageStyles.sectionCard}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Notes</h2>
            <p className={pageStyles.sectionDescription}>
              Additional context and internal event notes.
            </p>
          </div>
          <div className={pageStyles.sectionBody}>{notesField}</div>
        </section>

        <section className={pageStyles.sectionCard}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Pricing</h2>
            <p className={pageStyles.sectionDescription}>
              Ticket levels and price breakdown.
            </p>
          </div>
          <div className={pageStyles.sectionBody}>
            <EventPricingPanel
              pricing={(event.event_pricing ?? []).map(price => ({
                priceLevel: price.price_level,
                eventPrice: price.event_price.toString(),
              }))}
              readOnly={true}
            />
          </div>
        </section>
      </div>

      <div className={pageStyles.bottomSectionGrid}>
        <section className={pageStyles.sectionCard}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Gallery</h2>
            <p className={pageStyles.sectionDescription}>
              Event cover and supporting images.
            </p>
          </div>
          <div className={pageStyles.sectionBody}>
            <EventGalleryPanel
              galleries={event.event_galleries ?? []}
              readOnly={true}
            />
          </div>
        </section>

        <section className={pageStyles.sectionCard}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Time</h2>
            <p className={pageStyles.sectionDescription}>
              Dates and schedule details for this event.
            </p>
          </div>
          <div className={pageStyles.sectionBody}>{timeSectionContent}</div>
        </section>
      </div>

      <section
        className={`${pageStyles.sectionCard} ${pageStyles.featuredSection}`}
      >
        <div className={pageStyles.sectionHeader}>
          <h2 className={pageStyles.sectionTitle}>About</h2>
          <p className={pageStyles.sectionDescription}>
            Main event content and rich text description.
          </p>
        </div>
        <div className={pageStyles.sectionBody}>{aboutSectionContent}</div>
      </section>
    </div>
  );

  const modalSectionContent = (
    <div className={styles.sectionTabsBlock}>
      <div className={styles.sectionTabsHeader}>
        {SECTION_TABS.map(tab => {
          const isActive = activeSectionTab === tab;

          return (
            <button
              key={tab}
              type="button"
              className={`${styles.sectionTabButton} ${isActive ? styles.sectionTabButtonActive : ''}`}
              onClick={() => setActiveSectionTab(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeSectionTab === 'ABOUT' ? aboutSectionContent : null}
      {activeSectionTab === 'TIME' ? timeSectionContent : null}
      {activeSectionTab === 'GALLERY' ? (
        <EventGalleryPanel
          galleries={event.event_galleries ?? []}
          readOnly={true}
          layout="split"
        />
      ) : null}
      {activeSectionTab === 'PRICING' ? (
        <EventPricingPanel
          pricing={(event.event_pricing ?? []).map(price => ({
            priceLevel: price.price_level,
            eventPrice: price.event_price.toString(),
          }))}
          readOnly={true}
        />
      ) : null}
    </div>
  );

  return {
    pageContent: (
      <div className={`${styles.form} ${pageStyles.viewerForm}`}>
        <div
          className={`${styles.formContent} ${pageStyles.editorFormContent}`}
        >
          <div className={styles.formGroup}>
            <label htmlFor="eventTitleView" className={styles.label}>
              Event Title
            </label>
            <input
              id="eventTitleView"
              value={event.eventTitle}
              readOnly
              disabled
              className={`${styles.input} ${styles.viewField}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="eventLocationView" className={styles.label}>
              Event Location
            </label>
            <input
              id="eventLocationView"
              value={event.eventLocation}
              readOnly
              disabled
              className={`${styles.input} ${styles.viewField}`}
            />
          </div>

          <div className={styles.inlineFieldsRow}>
            <div className={styles.formGroup}>
              <label htmlFor="capacityMaxView" className={styles.label}>
                Capacity Max
              </label>
              <input
                id="capacityMaxView"
                value={String(event.capacity_max)}
                readOnly
                disabled
                className={`${styles.input} ${styles.viewField}`}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="eventStatusView" className={styles.label}>
                Status
              </label>
              <input
                id="eventStatusView"
                value={event.eventStatus}
                readOnly
                disabled
                className={`${styles.input} ${styles.viewField}`}
              />
            </div>
          </div>

          {pageSectionContent}
        </div>
      </div>
    ),
    modalContent: (
      <div className={styles.form}>
        <div className={styles.formContent}>
          <div className={styles.formGroup}>
            <label htmlFor="eventTitleView" className={styles.label}>
              Event Title
            </label>
            <input
              id="eventTitleView"
              value={event.eventTitle}
              readOnly
              disabled
              className={`${styles.input} ${styles.viewField}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="eventLocationView" className={styles.label}>
              Event Location
            </label>
            <input
              id="eventLocationView"
              value={event.eventLocation}
              readOnly
              disabled
              className={`${styles.input} ${styles.viewField}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="eventNotesView" className={styles.label}>
              Notes
            </label>
            <textarea
              id="eventNotesView"
              value={event.eventNotes ?? ''}
              readOnly
              disabled
              rows={3}
              className={`${styles.textarea} ${styles.viewField}`}
            />
          </div>

          <div className={styles.inlineFieldsRow}>
            <div className={styles.formGroup}>
              <label htmlFor="capacityMaxViewModal" className={styles.label}>
                Capacity Max
              </label>
              <input
                id="capacityMaxViewModal"
                value={String(event.capacity_max)}
                readOnly
                disabled
                className={`${styles.input} ${styles.viewField}`}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="eventStatusViewModal" className={styles.label}>
                Status
              </label>
              <input
                id="eventStatusViewModal"
                value={event.eventStatus}
                readOnly
                disabled
                className={`${styles.input} ${styles.viewField}`}
              />
            </div>
          </div>

          {modalSectionContent}
        </div>
      </div>
    ),
    selectedDraftSchedule,
    draftSchedules,
  };
}

function EventViewerPageClient({ event }: Readonly<PageProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const view = useEventViewState(event);
  const selectedDraftSchedule = view.selectedDraftSchedule;
  const canCancelWholeEvent =
    view.draftSchedules.length > 0 &&
    view.draftSchedules.every(schedule => canCancelSchedule(schedule));
  const canCancelSelectedDate = selectedDraftSchedule
    ? canCancelSchedule(selectedDraftSchedule)
    : false;

  function refreshCurrentPage() {
    router.refresh();
  }

  function handleCancelEvent() {
    const shouldCancel = globalThis.confirm(
      `Cancel this event?\n\n"${event.eventTitle}" will be marked inactive.`
    );
    if (!shouldCancel) return;

    startTransition(async () => {
      const result = await cancelEventAction(event.id);

      if (!result.success) {
        alert(result.error || 'Failed to cancel event');
        return;
      }

      refreshCurrentPage();
    });
  }

  function handleCancelSelectedDate() {
    if (!selectedDraftSchedule) return;

    const shouldCancel = globalThis.confirm(
      `Cancel this event date?\n\n${selectedDraftSchedule.eventDate.toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }
      )} ${selectedDraftSchedule.startTime} - ${selectedDraftSchedule.endTime}`
    );
    if (!shouldCancel) return;

    startTransition(async () => {
      const calendarId = Number.parseInt(
        selectedDraftSchedule.id.replace('calendar-', ''),
        10
      );

      console.info('Cancel Date clicked', {
        eventId: event.id,
        calendarId,
        selectedDate: selectedDraftSchedule.eventDate.toISOString(),
      });

      if (!Number.isInteger(calendarId) || calendarId <= 0) {
        alert('Failed to resolve the selected event date.');
        return;
      }

      const result = await cancelEventCalendarAction(event.id, calendarId);

      if (!result.success) {
        alert(result.error || 'Failed to cancel event date');
        return;
      }

      refreshCurrentPage();
    });
  }

  return (
    <div className={pageStyles.pageRoot}>
      <div className={pageStyles.pageGrid}>
        <section className={pageStyles.mainPanel}>{view.pageContent}</section>

        <aside className={pageStyles.sidebar}>
          <div
            className={`${pageStyles.actionCard} ${pageStyles.actionCardCompact}`}
          >
            <div className={pageStyles.actionStack}>
              <Button
                type="button"
                fullWidth={true}
                disabled={isPending}
                onClick={() => router.push(`/admin/events/${event.id}/edit`)}
              >
                Edit Event
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth={true}
                className={pageStyles.subtleDangerButton}
                disabled={isPending || !canCancelWholeEvent}
                onClick={handleCancelEvent}
              >
                Cancel Event
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth={true}
                disabled={isPending}
                onClick={() => router.push('/admin/events')}
              >
                Back to Events
              </Button>
            </div>
          </div>

          <div
            className={`${pageStyles.actionCard} ${pageStyles.actionCardCompact} ${pageStyles.dangerActionCard}`}
          >
            <div className={pageStyles.actionHeader}>
              <p className={pageStyles.actionEyebrow}>Selected Date</p>
              <h2 className={pageStyles.actionTitle}>
                {selectedDraftSchedule
                  ? selectedDraftSchedule.eventDate.toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )
                  : 'No date selected'}
              </h2>
              <p
                className={`${pageStyles.actionText} ${pageStyles.actionMeta}`}
              >
                {selectedDraftSchedule
                  ? `${selectedDraftSchedule.startTime} - ${selectedDraftSchedule.endTime}`
                  : 'Choose a date in TIME to enable date-level actions.'}
              </p>
            </div>

            <div className={pageStyles.actionStack}>
              <Button
                type="button"
                variant="secondary"
                fullWidth={true}
                className={pageStyles.subtleDangerButton}
                disabled={
                  !selectedDraftSchedule || isPending || !canCancelSelectedDate
                }
                onClick={handleCancelSelectedDate}
              >
                Cancel Date
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function EventViewPage({ event }: Readonly<PageProps>) {
  return <EventViewerPageClient event={event} />;
}

function EventViewModalInner({
  event,
  onClose,
}: Readonly<{ event: Event; onClose: () => void }>) {
  const view = useEventViewState(event);

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="View Event"
      panelClassName="!max-w-[calc(100vw-2rem)] sm:!max-w-4xl"
      bodyClassName="!overflow-hidden flex min-h-0 flex-col"
      rootTestId="event-view-modal-root"
      panelTestId="event-view-modal"
    >
      {view.modalContent}
    </ModalShell>
  );
}

export default function EventView({
  isOpen,
  onClose,
  event,
}: Readonly<ModalProps>) {
  if (!isOpen || !event) return null;

  return <EventViewModalInner event={event} onClose={onClose} />;
}
