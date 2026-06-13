import { describe, it, expect } from 'vitest';
import { isValidFlightNumber } from './flightValidation';

describe('isValidFlightNumber', () => {
  it.each([
    ['JL123'],
    ['nh456'],
    ['NH456'],
    ['  JL123  '],
    ['ABC'],
    ['ABCD1234'],
  ])('returns true for valid input: %s', (value) => {
    expect(isValidFlightNumber(value)).toBe(true);
  });

  it.each([
    [''],
    ['  '],
    ['X'],
    ['AB'],
    ['ABCDEFGHI'],
    ['JL-123'],
    ['JL 123'],
    [123],
  ])('returns false for invalid input: %s', (value) => {
    expect(isValidFlightNumber(value)).toBe(false);
  });
});
