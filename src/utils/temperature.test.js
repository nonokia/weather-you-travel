import { describe, it, expect } from 'vitest';
import { toFahrenheit, formatTemperature } from './temperature';

describe('toFahrenheit', () => {
  it('converts 0°C to 32°F', () => {
    expect(toFahrenheit(0)).toBe(32);
  });

  it('converts 100°C to 212°F', () => {
    expect(toFahrenheit(100)).toBe(212);
  });

  it('converts 37°C to 99°F (rounds 98.6)', () => {
    expect(toFahrenheit(37)).toBe(99);
  });
});

describe('formatTemperature', () => {
  it('formats in Celsius when unit is C', () => {
    expect(formatTemperature(18, 'C')).toBe('18°C');
  });

  it('formats in Fahrenheit when unit is F', () => {
    expect(formatTemperature(18, 'F')).toBe('64°F');
  });

  it('falls back to Celsius when unit is undefined', () => {
    expect(formatTemperature(18, undefined)).toBe('18°C');
  });

  it('falls back to Celsius for unknown unit', () => {
    expect(formatTemperature(18, 'X')).toBe('18°C');
  });

  it('rounds Celsius values', () => {
    expect(formatTemperature(18.6, 'C')).toBe('19°C');
  });
});
