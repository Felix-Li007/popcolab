'use client';

import { useMemo, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import EventGalleryPanel from '@/components/admin/event/event-gallery';
import EventPricingPanel from '@/components/admin/event/event-pricing';
import TimeSectionPanel from '@/components/admin/event/event-time';
import type { Event } from '@/types/event-type';
import styles from '@/styles/admin/events/event-form.module.css';
import { sanitizeRichTextHtml } from '@/utils/html-sanitizer';
import {
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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
};

function getInitialDraftSchedules(event?: Event): DraftSchedule[] {
  return (event?.event_calendars ?? []).flatMap(calendar => {
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
      id: 'initial',
      eventDate: new Date(),
      startTime: '',
      endTime: '',
    }
  );
}

export default function EventView({ isOpen, onClose, event }: Readonly<Props>) {
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('ABOUT');
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(
    event?.event_calendars?.[0]?.id ?? null
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
      [...(event?.event_calendars ?? [])].sort((left, right) => {
        const leftDate = parseCalendarDateValue(left.event_date);
        const rightDate = parseCalendarDateValue(right.event_date);
        const leftTime = leftDate?.getTime() ?? 0;
        const rightTime = rightDate?.getTime() ?? 0;
        if (leftTime !== rightTime) return leftTime - rightTime;
        return formatScheduleTimeValue(left.start_time).localeCompare(
          formatScheduleTimeValue(right.start_time)
        );
      }),
    [event?.event_calendars]
  );

  if (!isOpen || !event) return null;

  const sanitizedContentHtml = sanitizeRichTextHtml(event.contentHtml);

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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="View Event"
      panelClassName="!max-w-[calc(100vw-2rem)] sm:!max-w-4xl"
      bodyClassName="!overflow-hidden flex min-h-0 flex-col"
      rootTestId="event-view-modal-root"
      panelTestId="event-view-modal"
    >
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
        </div>
      </div>
    </ModalShell>
  );
}
