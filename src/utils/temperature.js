export function toFahrenheit(celsius) {
  return Math.round(celsius * 9 / 5 + 32);
}

export function formatTemperature(celsius, unit) {
  if (unit === 'F') {
    return `${toFahrenheit(celsius)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}
