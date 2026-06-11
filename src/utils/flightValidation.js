export function isValidFlightNumber(value) {
  if (typeof value !== 'string') return false;
  return /^[A-Za-z0-9]{3,8}$/.test(value.trim());
}
