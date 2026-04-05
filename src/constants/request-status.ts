export const REQUEST_STATUS = {
  OPENED: 'OPENED',
  PENDING: 'PENDING',
  MATCHED: 'MATCHED',
  CLOSED: 'CLOSED',
  PROCESSING: 'PROCESSING',
  RETRYING: 'RETRYING',
} as const;

export type RequestStatus =
  (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export const REQUEST_STATUS_OPTIONS: Array<{
  value: RequestStatus;
  label: string;
}> = [
  { value: REQUEST_STATUS.OPENED, label: 'OPENED' },
  { value: REQUEST_STATUS.PENDING, label: 'PENDING' },
  { value: REQUEST_STATUS.MATCHED, label: 'MATCHED' },
  { value: REQUEST_STATUS.CLOSED, label: 'CLOSED' },
  {
    value: REQUEST_STATUS.PROCESSING,
    label: 'PROCESSING',
  },
  {
    value: REQUEST_STATUS.RETRYING,
    label: 'RETRYING',
  },
];

export const REQUEST_STATUS_SET = new Set<RequestStatus>(
  REQUEST_STATUS_OPTIONS.map(option => option.value)
);

export function isRequestStatus(value: string): value is RequestStatus {
  return REQUEST_STATUS_SET.has(value as RequestStatus);
}

export function toRequestStatus(value: string): RequestStatus | null {
  const normalized = value.trim().toUpperCase();
  return isRequestStatus(normalized) ? normalized : null;
}

export function normalizeRequestStatus(
  value: string | null | undefined
): RequestStatus | null {
  if (!value) return null;
  return toRequestStatus(value);
}

export function getRequestStatusLabel(
  value: RequestStatus | null | undefined
): string | null {
  if (!value) return null;
  const option = REQUEST_STATUS_OPTIONS.find(item => item.value === value);
  return option?.label ?? null;
}
