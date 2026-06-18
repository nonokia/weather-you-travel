export function formatForecastDate(isoDate, locale) {
  if (!isoDate) return isoDate;
  try {
    // Append T00:00:00 to force local-calendar parsing and avoid UTC midnight drift.
    const date = new Date(`${isoDate}T00:00:00`);
    if (isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoDate;
  }
}
