const NEW_EXPERIENCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewExperience(createdAt?: Date) {
  if (!createdAt) return false;

  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return false;

  return Date.now() - createdTime <= NEW_EXPERIENCE_WINDOW_MS;
}
