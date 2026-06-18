import { describe, it, expect } from 'vitest';
import { formatForecastDate } from './formatDate';

describe('formatForecastDate', () => {
  it('valid date English: contains day number', () => {
    const result = formatForecastDate('2025-11-29', 'en');
    expect(result).toMatch(/29/);
  });

  it('valid date English: contains month Nov or November', () => {
    const result = formatForecastDate('2025-11-29', 'en');
    expect(result).toMatch(/Nov|November/);
  });

  it('valid date English: contains weekday Sat or Saturday (2025-11-29 is a Saturday)', () => {
    const result = formatForecastDate('2025-11-29', 'en');
    expect(result).toMatch(/Sat|Saturday/);
  });

  it('valid date Japanese: contains day digit 29 and month digit 11', () => {
    const result = formatForecastDate('2025-11-29', 'ja');
    expect(result).toMatch(/29/);
    expect(result).toMatch(/11/);
  });

  it('invalid input returns unchanged', () => {
    expect(formatForecastDate('not-a-date', 'en')).toBe('not-a-date');
  });

  it('empty string returns unchanged', () => {
    expect(formatForecastDate('', 'en')).toBe('');
  });

  it('null returns null', () => {
    expect(formatForecastDate(null, 'en')).toBeNull();
  });

  it('undefined returns undefined', () => {
    expect(formatForecastDate(undefined, 'en')).toBeUndefined();
  });

  it('null locale uses system locale and formats the date', () => {
    const result = formatForecastDate('2025-11-29', null);
    expect(result).toMatch(/29/);
    expect(result).not.toBe('2025-11-29');
  });
});
