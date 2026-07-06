import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWeatherIcon,
  cityFromTimezone,
  mapAviationStackFlight,
  aggregateForecast,
  getFlightDetails,
  getWeather,
} from './api';

describe('getWeatherIcon', () => {
  it('maps known OpenWeatherMap conditions to icons', () => {
    expect(getWeatherIcon('Clear')).toBe('☀️');
    expect(getWeatherIcon('Clouds')).toBe('☁️');
    expect(getWeatherIcon('Rain')).toBe('🌧️');
    expect(getWeatherIcon('Snow')).toBe('❄️');
  });

  it('is case-insensitive', () => {
    expect(getWeatherIcon('CLEAR')).toBe('☀️');
    expect(getWeatherIcon('clouds')).toBe('☁️');
  });

  it('returns a real weather glyph (not a typo placeholder) for unknown conditions', () => {
    // Regression guard: an earlier version returned the literal string "tj".
    const fallback = getWeatherIcon('Tornado');
    expect(fallback).toBe('🌫️');
    expect(fallback).not.toMatch(/[a-z]/i);
  });

  it('does not throw on nullish input', () => {
    expect(() => getWeatherIcon(undefined)).not.toThrow();
    expect(() => getWeatherIcon(null)).not.toThrow();
  });
});

describe('cityFromTimezone', () => {
  it('extracts and humanizes the city from an IANA timezone', () => {
    expect(cityFromTimezone('America/Los_Angeles')).toBe('Los Angeles');
    expect(cityFromTimezone('Asia/Tokyo')).toBe('Tokyo');
  });

  it('uses the last segment for multi-part zones', () => {
    expect(cityFromTimezone('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
  });

  it('returns the input unchanged when there is no slash', () => {
    expect(cityFromTimezone('UTC')).toBe('UTC');
  });

  it('handles empty / missing values without throwing', () => {
    expect(cityFromTimezone('')).toBe('');
    expect(cityFromTimezone(undefined)).toBe('');
  });
});

describe('mapAviationStackFlight', () => {
  const raw = {
    flight: { iata: 'JL123' },
    airline: { name: 'Japan Airlines' },
    departure: {
      iata: 'HND',
      airport: 'Haneda Airport',
      timezone: 'Asia/Tokyo',
      scheduled: '2026-07-01T10:00:00+00:00',
    },
    arrival: {
      iata: 'ITM',
      airport: 'Itami Airport',
      timezone: 'Asia/Osaka',
      scheduled: '2026-07-01T11:10:00+00:00',
    },
  };

  it('normalizes a raw record into the internal shape', () => {
    expect(mapAviationStackFlight(raw)).toEqual({
      flightNumber: 'JL123',
      airline: 'Japan Airlines',
      departure: { airport: 'HND', airportName: 'Haneda Airport', city: 'Tokyo', time: '10:00' },
      arrival: { airport: 'ITM', airportName: 'Itami Airport', city: 'Osaka', time: '11:10' },
    });
  });
});

describe('aggregateForecast', () => {
  // 24 three-hourly entries == 3 days.
  const list = Array.from({ length: 24 }, (_, i) => ({
    dt_txt: `2026-07-0${Math.floor(i / 8) + 1} ${String((i % 8) * 3).padStart(2, '0')}:00:00`,
    main: { temp: 20 + i * 0.4 },
    weather: [{ main: i % 2 === 0 ? 'Clear' : 'Rain' }],
  }));

  it('collapses 3-hourly data into one entry per day', () => {
    const out = aggregateForecast(list, 3);
    expect(out).toHaveLength(3);
    expect(out.map((d) => d.date)).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
  });

  it('rounds the temperature', () => {
    const out = aggregateForecast(list, 1);
    expect(Number.isInteger(out[0].temp)).toBe(true);
  });

  it('respects the days cap', () => {
    expect(aggregateForecast(list, 2)).toHaveLength(2);
  });
});

describe('getFlightDetails (mock fallback)', () => {
  it('resolves a known mock flight number (case-insensitive)', async () => {
    const flight = await getFlightDetails('jl123');
    expect(flight.flightNumber).toBe('JL123');
    expect(flight.arrival.city).toBe('Osaka');
  });

  it('rejects an unknown flight number', async () => {
    await expect(getFlightDetails('XX000')).rejects.toThrow('Flight not found');
  });
});

describe('getWeather (mock fallback)', () => {
  it('returns forecast for a known city, capped to the requested days', async () => {
    const forecast = await getWeather('Osaka', 2);
    expect(forecast).toHaveLength(2);
    expect(forecast[0]).toHaveProperty('temp');
  });

  it('returns an empty array for an unknown city', async () => {
    expect(await getWeather('Atlantis')).toEqual([]);
  });
});

// Real-API path: with a key present, the fetch transform should run end-to-end.
describe('real-API code path', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('aggregateForecast handles a realistic OpenWeather payload slice', () => {
    const payload = {
      list: [
        { dt_txt: '2026-07-01 12:00:00', main: { temp: 27.6 }, weather: [{ main: 'Clear' }] },
      ],
    };
    const out = aggregateForecast(payload.list, 1);
    expect(out[0]).toEqual({ date: '2026-07-01', temp: 28, condition: 'Clear', icon: '☀️' });
  });

  it('fetches and maps a real AviationStack flight when the API key is set', async () => {
    const raw = {
      flight: { iata: 'JL123' },
      airline: { name: 'Japan Airlines' },
      departure: {
        iata: 'HND',
        airport: 'Haneda Airport',
        timezone: 'Asia/Tokyo',
        scheduled: '2026-07-01T10:00:00+00:00',
      },
      arrival: {
        iata: 'ITM',
        airport: 'Itami Airport',
        timezone: 'Asia/Osaka',
        scheduled: '2026-07-01T11:10:00+00:00',
      },
    };
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: [raw] }),
    }));

    const { getFlightDetails, mapAviationStackFlight } = await import('./api');
    const result = await getFlightDetails('JL123');

    expect(result).toEqual(mapAviationStackFlight(raw));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('flight_iata=JL123');
  });

  it('fetches and aggregates a real OpenWeatherMap forecast when the API key is set', async () => {
    const list = Array.from({ length: 24 }, (_, i) => ({
      dt_txt: `2026-07-0${Math.floor(i / 8) + 1} ${String((i % 8) * 3).padStart(2, '0')}:00:00`,
      main: { temp: 20 + i * 0.4 },
      weather: [{ main: i % 2 === 0 ? 'Clear' : 'Rain' }],
    }));
    vi.stubEnv('VITE_OPENWEATHER_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ list }),
    }));

    const { getWeather, aggregateForecast } = await import('./api');
    const result = await getWeather('Osaka', 3);

    expect(result).toEqual(aggregateForecast(list, 3));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('q=Osaka');
  });

  it('falls back to mock flight data when the AviationStack fetch rejects', async () => {
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { getFlightDetails } = await import('./api');
    const result = await getFlightDetails('JL123');

    expect(result.flightNumber).toBe('JL123');
    expect(result.arrival.city).toBe('Osaka');
  });

  it('falls back to mock flight data when AviationStack returns an unexpected shape', async () => {
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ error: 'rate limited' }), // no `data` key
    }));

    const { getFlightDetails } = await import('./api');
    const result = await getFlightDetails('JL123');

    expect(result.flightNumber).toBe('JL123');
  });

  it('falls back to mock weather data when the OpenWeatherMap fetch rejects', async () => {
    vi.stubEnv('VITE_OPENWEATHER_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { getWeather } = await import('./api');
    const result = await getWeather('Osaka', 2);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('temp');
  });

  it('falls back to mock weather data when OpenWeatherMap returns an unexpected shape', async () => {
    vi.stubEnv('VITE_OPENWEATHER_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ error: 'rate limited' }), // no `list` key
    }));

    const { getWeather } = await import('./api');
    const result = await getWeather('Osaka', 2);

    expect(result).toHaveLength(2);
  });
});
