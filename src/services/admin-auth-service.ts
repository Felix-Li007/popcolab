import 'server-only';

// Temporary bypass for admin auth checks.
// TODO: Restore real auth validation before production release.

export async function isAdminUser(): Promise<boolean> {
  return true;
}

export async function requireAdminPageAccess(): Promise<void> {
  return;
}

export async function requireAdminActionAccess(): Promise<void> {
  return;
}
