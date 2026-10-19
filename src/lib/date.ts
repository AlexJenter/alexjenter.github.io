/**
 * A post date as the site shows it, e.g. "14 July 2026". Date-only strings
 * get a local midnight so they don't shift a day across time zones.
 */
export function formatDate(date: string): string {
  return new Date(
    date.includes("T") ? date : date + "T00:00:00",
  ).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
