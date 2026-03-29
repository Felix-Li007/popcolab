'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/styles/admin/events/event-content.module.css';

type Props = {
  id: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  defaultTime: string;
};

type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

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

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function parseDateTimeValue(value: string) {
  if (!value.trim()) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTimeValue(date: Date, timeValue: string) {
  const [hoursText = '00', minutesText = '00'] = timeValue.split(':');
  const nextDate = new Date(date);
  nextDate.setHours(Number(hoursText), Number(minutesText), 0, 0);

  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  const hours = String(nextDate.getHours()).padStart(2, '0');
  const minutes = String(nextDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatTriggerLabel(value: string, placeholder: string) {
  const parsed = parseDateTimeValue(value);
  if (!parsed) return placeholder;

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
      isToday: sameDay(date, today),
      isSelected: selectedDate ? sameDay(date, selectedDate) : false,
    } satisfies CalendarCell;
  });
}

export default function DatePicker({
  id,
  ariaLabel,
  value,
  onChange,
  placeholder,
  defaultTime,
}: Readonly<Props>) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const parsedValue = useMemo(() => parseDateTimeValue(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | null>(parsedValue);
  const [draftTime, setDraftTime] = useState(() =>
    parsedValue
      ? `${String(parsedValue.getHours()).padStart(2, '0')}:${String(parsedValue.getMinutes()).padStart(2, '0')}`
      : defaultTime
  );
  const [viewDate, setViewDate] = useState<Date>(parsedValue ?? new Date());

  function syncDraftState() {
    const nextParsedValue = parseDateTimeValue(value);
    setDraftDate(nextParsedValue);
    setDraftTime(
      nextParsedValue
        ? `${String(nextParsedValue.getHours()).padStart(2, '0')}:${String(nextParsedValue.getMinutes()).padStart(2, '0')}`
        : defaultTime
    );
    setViewDate(nextParsedValue ?? new Date());
  }

  function openPicker() {
    syncDraftState();
    setIsOpen(true);
  }

  function togglePicker() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    openPicker();
  }

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const yearOptions = buildYearOptions(viewDate.getFullYear());
  const calendarCells = buildCalendarCells(viewDate, draftDate);

  return (
    <div ref={rootRef} className={styles.filterField}>
      <label className={styles.srOnlyLabel} htmlFor={id}>
        {ariaLabel}
      </label>

      <div className={styles.datePickerTrigger}>
        <input
          id={id}
          type="text"
          readOnly
          value={parsedValue ? formatTriggerLabel(value, placeholder) : ''}
          placeholder={placeholder}
          className={`${styles.filterInput} ${styles.datePickerInput}`}
          onClick={togglePicker}
          onFocus={openPicker}
        />
        <span className={styles.datePickerTriggerIcon} aria-hidden="true">
          ▾
        </span>
      </div>

      {isOpen ? (
        <div className={styles.datePickerPopover}>
          <div className={styles.datePickerHeader}>
            <select
              className={styles.datePickerSelect}
              value={viewDate.getMonth()}
              onChange={event =>
                setViewDate(
                  createCalendarDate(
                    viewDate,
                    viewDate.getFullYear(),
                    Number(event.target.value)
                  )
                )
              }
              aria-label={`${ariaLabel} month`}
            >
              {MONTH_OPTIONS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              className={styles.datePickerSelect}
              value={viewDate.getFullYear()}
              onChange={event =>
                setViewDate(
                  createCalendarDate(
                    viewDate,
                    Number(event.target.value),
                    viewDate.getMonth()
                  )
                )
              }
              aria-label={`${ariaLabel} year`}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.datePickerWeekdays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <span key={day} className={styles.datePickerWeekday}>
                {day}
              </span>
            ))}
          </div>

          <div className={styles.datePickerDaysGrid}>
            {calendarCells.map(cell => (
              <button
                key={cell.date.toISOString()}
                type="button"
                className={[
                  styles.datePickerDay,
                  !cell.isCurrentMonth ? styles.datePickerDayMuted : '',
                  cell.isToday ? styles.datePickerDayToday : '',
                  cell.isSelected ? styles.datePickerDaySelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setDraftDate(cell.date)}
              >
                {cell.date.getDate()}
              </button>
            ))}
          </div>

          <div className={styles.datePickerTimeRow}>
            <span className={styles.datePickerTimeLabel}>Time</span>
            <input
              type="time"
              value={draftTime}
              onChange={event => setDraftTime(event.target.value)}
              className={styles.datePickerTimeInput}
            />
          </div>

          <div className={styles.datePickerActions}>
            <button
              type="button"
              className={styles.datePickerActionButton}
              onClick={() => {
                onChange('');
                setDraftDate(null);
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className={`${styles.datePickerActionButton} ${styles.datePickerActionButtonPrimary}`}
              onClick={() => {
                if (!draftDate) return;
                onChange(formatDateTimeValue(draftDate, draftTime));
                setIsOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
