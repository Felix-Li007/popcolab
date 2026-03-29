function padTwoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function formatUtcDateParts(date: Date) {
  return [
    date.getUTCFullYear(),
    padTwoDigits(date.getUTCMonth() + 1),
    padTwoDigits(date.getUTCDate()),
  ].join('-');
}

function formatUtcTimeParts(date: Date) {
  return [
    padTwoDigits(date.getUTCHours()),
    padTwoDigits(date.getUTCMinutes()),
  ].join(':');
}

export function formatLocalDateValue(date: Date) {
  return [
    date.getFullYear(),
    padTwoDigits(date.getMonth() + 1),
    padTwoDigits(date.getDate()),
  ].join('-');
}

export function formatLocalTimeValue(date: Date) {
  return [padTwoDigits(date.getHours()), padTwoDigits(date.getMinutes())].join(
    ':'
  );
}

export function parseCalendarDateValue(value: Date | string) {
  if (value instanceof Date) {
    return parseDateInputValue(formatUtcDateParts(value));
  }

  if (!value) return null;

  const normalizedValue = value.slice(0, 10);
  const parsedLocalDate = parseDateInputValue(normalizedValue);
  if (parsedLocalDate) {
    return parsedLocalDate;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatScheduleTimeValue(value: Date | string) {
  if (value instanceof Date) {
    return formatUtcTimeParts(value);
  }

  if (!value) return '';

  const matchedTime = value.match(/^(\d{2}):(\d{2})/);
  if (matchedTime) {
    return `${matchedTime[1]}:${matchedTime[2]}`;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? ''
    : formatUtcTimeParts(parsedDate);
}

export function parseDateInputValue(value: string) {
  if (!value) return null;

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function normalizeTimeValue(value: string) {
  if (!value || !value.trim()) {
    return null;
  }

  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${padTwoDigits(hour)}:${padTwoDigits(minute)}:00`;
}

export function formatDateForPrismaDateField(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  );
}

export function formatTimeForPrismaTimeField(value: string) {
  const normalizedTime = normalizeTimeValue(value);
  if (!normalizedTime) return null;

  const [hourText = '00', minuteText = '00', secondText = '00'] =
    normalizedTime.split(':');

  return new Date(
    Date.UTC(
      1970,
      0,
      1,
      Number(hourText) || 0,
      Number(minuteText) || 0,
      Number(secondText) || 0,
      0
    )
  );
}

export function mergeDateAndTime(date: Date, timeValue: string) {
  const [hourText = '00', minuteText = '00'] = timeValue.split(':');
  const mergedDate = new Date(date);
  mergedDate.setHours(Number(hourText) || 0, Number(minuteText) || 0, 0, 0);
  return mergedDate;
}
