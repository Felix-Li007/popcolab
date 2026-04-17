export function showBookingUnavailable(targetLabel?: string) {
  if (typeof window === 'undefined') return;

  const label = targetLabel ? ` for "${targetLabel}"` : '';

  window.alert(
    `Booking${label} is not available yet. Please contact support or check back later.`
  );
}
