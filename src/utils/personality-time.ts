const PERSONALITY_TIME_ZONE = 'America/Winnipeg';

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);

  function getPart(type: Intl.DateTimeFormatPartTypes): number {
    return Number(parts.find(part => part.type === type)?.value ?? '0');
  }

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second'),
  };
}

export function getPersonalityLocalTimestamp(now = new Date()): Date {
  const parts = getTimeZoneParts(now, PERSONALITY_TIME_ZONE);

  // Encode the Winnipeg wall-clock time directly into a timezone-less timestamp.
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      now.getMilliseconds()
    )
  );
}

export function formatStoredPersonalityDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
}
