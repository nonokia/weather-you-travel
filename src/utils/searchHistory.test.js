import { describe, it, expect, beforeEach } from 'vitest';
import { getRecentSearches, addRecentSearch } from './searchHistory';

beforeEach(() => {
  localStorage.clear();
});

describe('getRecentSearches', () => {
  it('returns [] when localStorage is empty', () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it('returns [] when localStorage value is corrupt', () => {
    localStorage.setItem('wyt:recentSearches', 'not-valid-json{{{');
    expect(getRecentSearches()).toEqual([]);
  });

  it('returns [] when localStorage value is valid JSON but not an array', () => {
    localStorage.setItem('wyt:recentSearches', '{"foo":"bar"}');
    expect(getRecentSearches()).toEqual([]);
  });
});

describe('addRecentSearch', () => {
  it('stores and returns a single entry normalised to uppercase', () => {
    const result = addRecentSearch('jl123');
    expect(result).toEqual(['JL123']);
  });

  it('returns most-recent-first order when called twice with different values', () => {
    addRecentSearch('JL123');
    const result = addRecentSearch('NH456');
    expect(result).toEqual(['NH456', 'JL123']);
  });

  it('de-duplicates case-insensitively and moves the entry to the front', () => {
    addRecentSearch('JL123');
    addRecentSearch('NH456');
    const result = addRecentSearch('jl123');
    expect(result).toEqual(['JL123', 'NH456']);
  });

  it('caps the list at 5 entries, dropping the oldest', () => {
    ['AA1', 'BB2', 'CC3', 'DD4', 'EE5', 'FF6'].forEach((f) => addRecentSearch(f));
    const result = getRecentSearches();
    expect(result).toHaveLength(5);
    expect(result).not.toContain('AA1');
  });
});
