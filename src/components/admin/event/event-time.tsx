'use client';

import { useState } from 'react';
import type { Event } from '@/types/event-type';
import styles from '@/styles/admin/events/event-form.module.css';
import {
  formatLocalDateValue,
  formatLocalTimeValue,
  parseCalendarDateValue,
  parseDateInputValue,
  formatScheduleTimeValue,
} from '@/utils/event-schedule';

type DraftSchedule = {
  id: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
};

type TimeSectionPanelProps = {
  calendars: NonNullable<Event['event_calendars']>;
  selectedCalendarId: number | null;
  onSelectCalendar: (calendarId: number) => void;
  isEditable: boolean;
  useEditableLayout?: boolean;
  allowScheduleSelectionWhenReadOnly?: boolean;
  showActionButtons?: boolean;
  draftDate: Date;
  draftStartTime: string;
  draftEndTime: string;
  draftSchedules: DraftSchedule[];
  selectedDraftScheduleId: string | null;
  onDraftDateChange: (date: Date) => void;
  onDraftStartTimeChange: (time: string) => void;
  onDraftEndTimeChange: (time: string) => void;
  onSelectDraftSchedule: (scheduleId: string) => void;
  onAddDraftSchedule: () => void;
  onDeleteDraftSchedule: () => void;
};

type CalendarCell = {
  date: Date;
  label: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildCalendarCells(viewDate: Date, selectedDate: Date | null) {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const today = new Date();

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      label: String(date.getDate()),
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
      isToday: sameDay(date, today),
      isSelected: selectedDate ? sameDay(date, selectedDate) : false,
    } satisfies CalendarCell;
  });
}

function formatCalendarTime(dateValue: Date | string) {
  return formatScheduleTimeValue(dateValue);
}

function formatTimeLabel(timeValue: string) {
  const [hourText = '00', minuteText = '00'] = timeValue.split(':');
  return `${hourText.padStart(2, '0')}:${minuteText.padStart(2, '0')}`;
}

function createCalendarDate(baseDate: Date, year: number, month: number) {
  const nextDate = new Date(baseDate);
  const dayOfMonth = nextDate.getDate();

  nextDate.setFullYear(year, month, 1);

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));

  return nextDate;
}

function buildYearOptions(currentYear: number) {
  return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
}

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

type CalendarViewportProps = {
  activeDate: Date;
  onSelectDate?: (date: Date) => void;
  disabled?: boolean;
};

function CalendarViewport({
  activeDate,
  onSelectDate,
  disabled = false,
}: Readonly<CalendarViewportProps>) {
  const [viewDate, setViewDate] = useState(() => new Date(activeDate));

  const calendarCells = buildCalendarCells(viewDate, activeDate);
  const yearOptions = buildYearOptions(viewDate.getFullYear());

  function updateViewDate(nextDate: Date) {
    setViewDate(nextDate);
    onSelectDate?.(nextDate);
  }

  function goToToday() {
    updateViewDate(new Date());
  }

  return (
    <>
      <div className={styles.timeCalendarHeader}>
        <label className={styles.timeCalendarHeaderField}>
          <select
            className={`${styles.timeCalendarSelect} ${styles.timeCalendarSelectYear}`}
            value={viewDate.getFullYear()}
            disabled={disabled}
            onChange={event => {
              const nextDate = createCalendarDate(
                viewDate,
                Number(event.target.value),
                viewDate.getMonth()
              );
              updateViewDate(nextDate);
            }}
            aria-label="Calendar year"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.timeCalendarHeaderField}>
          <select
            className={styles.timeCalendarSelect}
            value={viewDate.getMonth()}
            disabled={disabled}
            onChange={event => {
              const nextDate = createCalendarDate(
                viewDate,
                viewDate.getFullYear(),
                Number(event.target.value)
              );
              updateViewDate(nextDate);
            }}
            aria-label="Calendar month"
          >
            {MONTH_OPTIONS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.timeCalendarHeaderAction}
          disabled={disabled}
          onClick={goToToday}
        >
          Today
        </button>
      </div>

      <div className={styles.timeCalendarBody}>
        <div className={styles.timeCalendarMonthGrid}>
          <div className={styles.timeCalendarWeekdays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <span key={day} className={styles.timeCalendarWeekday}>
                {day}
              </span>
            ))}
          </div>

          <div className={styles.timeCalendarDaysGrid}>
            {calendarCells.map(cell => (
              <button
                key={`${cell.date.toISOString()}-${cell.label}`}
                type="button"
                disabled={disabled}
                className={`${styles.timeCalendarDay} ${cell.isCurrentMonth ? '' : styles.timeCalendarDayMuted} ${cell.isSelected ? styles.timeCalendarDaySelected : ''} ${cell.isToday ? styles.timeCalendarDayToday : ''}`}
                onClick={() => updateViewDate(cell.date)}
              >
                {cell.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function TimeSectionPanel({
  calendars,
  selectedCalendarId,
  onSelectCalendar,
  isEditable,
  useEditableLayout = isEditable,
  allowScheduleSelectionWhenReadOnly = false,
  showActionButtons = true,
  draftDate,
  draftStartTime,
  draftEndTime,
  draftSchedules,
  selectedDraftScheduleId,
  onDraftDateChange,
  onDraftStartTimeChange,
  onDraftEndTimeChange,
  onSelectDraftSchedule,
  onAddDraftSchedule,
  onDeleteDraftSchedule,
}: Readonly<TimeSectionPanelProps>) {
  const selectedCalendar =
    calendars.find(calendar => calendar.id === selectedCalendarId) ??
    calendars[0] ??
    null;

  const selectedDate = selectedCalendar
    ? parseCalendarDateValue(selectedCalendar.event_date)
    : null;

  const activeDate = isEditable ? draftDate : (selectedDate ?? draftDate);

  const activeDateValue = formatLocalDateValue(activeDate);
  const selectedDraftSchedule = draftSchedules.find(
    schedule => schedule.id === selectedDraftScheduleId
  );
  const canSelectDraftSchedule =
    isEditable || allowScheduleSelectionWhenReadOnly;

  return (
    <div className={`${styles.sectionPanel} ${styles.timeSectionPanel}`}>
      {useEditableLayout ? (
        <div className={styles.timeLayout}>
          <div className={styles.timeListPanel}>
            {draftSchedules.length > 0 ? (
              <div className={styles.timeListGrid}>
                {draftSchedules.map(schedule => {
                  const isSelected = schedule.id === selectedDraftScheduleId;

                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      disabled={!canSelectDraftSchedule}
                      className={`${styles.timeListCard} ${isSelected ? styles.timeListCardActive : ''}`}
                      onClick={() => {
                        if (!canSelectDraftSchedule) return;
                        onSelectDraftSchedule(schedule.id);
                      }}
                    >
                      <p className={styles.timeListCardTitle}>
                        {schedule.eventDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className={styles.timeListCardMeta}>
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.timeListEmptyNotice}>
                No dates added yet
              </div>
            )}
          </div>

          <div className={styles.timeCalendarPanel}>
            <CalendarViewport
              key={activeDateValue}
              activeDate={activeDate}
              disabled={!isEditable}
              onSelectDate={isEditable ? onDraftDateChange : undefined}
            />

            <div className={styles.timeCalendarTimeRow}>
              <span className={styles.timeCalendarLabel}>Time</span>

              <input
                type="time"
                value={draftStartTime}
                disabled={!isEditable}
                onChange={event => onDraftStartTimeChange(event.target.value)}
                className={styles.timeCalendarInput}
                aria-label="Start time"
                title="Start time"
              />

              <span className={styles.timeCalendarTimeSeparator}>-</span>

              <input
                type="time"
                value={draftEndTime}
                disabled={!isEditable}
                onChange={event => onDraftEndTimeChange(event.target.value)}
                className={styles.timeCalendarInput}
                aria-label="End time"
                title="End time"
              />
            </div>

            {showActionButtons ? (
              <div className={styles.timeActionRow}>
                <button
                  type="button"
                  className={styles.timeActionButton}
                  disabled={!isEditable}
                  onClick={onAddDraftSchedule}
                >
                  Add
                </button>
                <button
                  type="button"
                  className={styles.timeActionButton}
                  onClick={onDeleteDraftSchedule}
                  disabled={!isEditable || !selectedDraftSchedule}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={styles.timeLayout}>
          <div className={styles.timeListPanel}>
            {calendars.length > 0 ? (
              <div className={styles.timeListGrid}>
                {calendars.map(calendar => {
                  const isSelected = calendar.id === selectedCalendar?.id;

                  return (
                    <button
                      key={calendar.id}
                      type="button"
                      className={`${styles.timeListCard} ${isSelected ? styles.timeListCardActive : ''}`}
                      onClick={() => onSelectCalendar(calendar.id)}
                    >
                      <p className={styles.timeListCardTitle}>
                        {(
                          parseCalendarDateValue(calendar.event_date) ??
                          new Date()
                        ).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className={styles.timeListCardMeta}>
                        {formatCalendarTime(calendar.start_time)} -{' '}
                        {formatCalendarTime(calendar.end_time)}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.timeListEmptyNotice}>
                No dates added yet
              </div>
            )}
          </div>

          <div className={styles.timeCalendarPanel}>
            <CalendarViewport key={activeDateValue} activeDate={activeDate} />

            <div className={styles.timeCalendarPicker}>
              <div className={styles.timeCalendarPickerHeader}>
                <div>
                  <p className={styles.timeCalendarPickerTitle}>
                    Selected schedule
                  </p>
                  <p className={styles.timeCalendarPickerSubtitle}>
                    Use the inputs below to adjust the selected day and times.
                  </p>
                </div>
                <div className={styles.timeCalendarPickerSummary}>
                  <span className={styles.timeCalendarPickerSummaryLabel}>
                    {activeDateValue}
                  </span>
                  <span className={styles.timeCalendarPickerSummaryValue}>
                    {formatTimeLabel(draftStartTime)} -{' '}
                    {formatTimeLabel(draftEndTime)}
                  </span>
                </div>
              </div>

              <div className={styles.timeCalendarPickerInputs}>
                <div className={styles.timeCalendarField}>
                  <span className={styles.timeCalendarLabel}>Date</span>
                  <input
                    type="date"
                    value={activeDateValue}
                    onChange={event => {
                      const nextDate = parseDateInputValue(event.target.value);
                      if (nextDate) {
                        onDraftDateChange(nextDate);
                      }
                    }}
                    className={styles.timeCalendarInput}
                    aria-label="Event date"
                    title="Event date"
                  />
                </div>

                <div className={styles.timeCalendarFieldRow}>
                  <div className={styles.timeCalendarField}>
                    <span className={styles.timeCalendarLabel}>Start</span>
                    <input
                      type="time"
                      value={draftStartTime}
                      onChange={event =>
                        onDraftStartTimeChange(event.target.value)
                      }
                      className={styles.timeCalendarInput}
                      aria-label="Start time"
                      title="Start time"
                    />
                  </div>

                  <div className={styles.timeCalendarField}>
                    <span className={styles.timeCalendarLabel}>End</span>
                    <input
                      type="time"
                      value={draftEndTime}
                      onChange={event =>
                        onDraftEndTimeChange(event.target.value)
                      }
                      className={styles.timeCalendarInput}
                      aria-label="End time"
                      title="End time"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
