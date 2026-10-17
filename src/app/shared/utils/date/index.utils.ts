/** Data local (yyyy-MM-dd) de `days` dias atrás; `localDateDaysAgo(0)` é hoje. */
export function localDateDaysAgo(days: number, today = new Date()): string {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
