export function getFormEntryString(
  value: FormDataEntryValue | null | undefined
): string {
  return typeof value === 'string' ? value : '';
}

export function getTrimmedFormEntryString(
  value: FormDataEntryValue | null | undefined
): string {
  return getFormEntryString(value).trim();
}

export function getFormString(formData: FormData, key: string): string {
  return getFormEntryString(formData.get(key));
}

export function getTrimmedFormString(formData: FormData, key: string): string {
  return getTrimmedFormEntryString(formData.get(key));
}

export function getTrimmedFormStrings(
  formData: FormData,
  key: string
): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string')
    .map(value => value.trim());
}

export function getNullableTrimmedFormString(
  formData: FormData,
  key: string
): string | null {
  const value = getTrimmedFormString(formData, key);
  return value === '' ? null : value;
}
