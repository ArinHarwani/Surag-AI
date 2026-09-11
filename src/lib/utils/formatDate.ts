/**
 * Deterministic date and time formatting utilities.
 *
 * Next.js SSR executes in Node.js (defaulting to system/UTC locale), whereas client
 * hydration executes in the user's browser locale and timezone.
 * Using native `toLocaleTimeString()` or `toLocaleString()` causes React hydration mismatch errors.
 *
 * These functions deterministically project timestamps into Indian Standard Time (IST: UTC+5:30)
 * using UTC date arithmetic so the exact same string is output on both server and client.
 */

export function formatTimeIST(dateInput: string | number | Date | null | undefined, includeSeconds = true): string {
  if (!dateInput) return '--:--:-- IST';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '--:--:-- IST';

  // Deterministically compute IST: UTC + 5 hours 30 mins (19,800,000 ms)
  const istEpoch = date.getTime() + (5.5 * 60 * 60 * 1000);
  const istDate = new Date(istEpoch);

  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');

  return includeSeconds ? `${hours}:${minutes}:${seconds} IST` : `${hours}:${minutes} IST`;
}

export function formatDateIST(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '--/--/----';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '--/--/----';

  const istEpoch = date.getTime() + (5.5 * 60 * 60 * 1000);
  const istDate = new Date(istEpoch);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

export function formatDateTimeIST(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '--';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '--';

  const istEpoch = date.getTime() + (5.5 * 60 * 60 * 1000);
  const istDate = new Date(istEpoch);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes} IST`;
}
