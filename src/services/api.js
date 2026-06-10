
// Mock Flight Data
const FLIGHTS = {
  'JL123': {
    flightNumber: 'JL123',
    airline: 'Japan Airlines',
    departure: {
      airport: 'HND',
      airportName: 'Haneda Airport',
      city: 'Tokyo',
      time: '10:00'
    },
    arrival: {
      airport: 'ITM',
      airportName: 'Itami Airport',
      city: 'Osaka',
      time: '11:10'
    }
  },
  'NH456': {
    flightNumber: 'NH456',
    airline: 'All Nippon Airways',
    departure: {
      airport: 'HND',
      airportName: 'Haneda Airport',
      city: 'Tokyo',
      time: '12:00'
    },
    arrival: {
      airport: 'FUK',
      airportName: 'Fukuoka Airport',
      city: 'Fukuoka',
      time: '14:00'
    }
  },
  'JL999': {
    flightNumber: 'JL999',
    airline: 'Japan Airlines',
    departure: {
      airport: 'NRT',
      airportName: 'Narita Airport',
      city: 'Tokyo',
      time: '18:00'
    },
    arrival: {
      airport: 'LAX',
      airportName: 'Los Angeles Intl',
      city: 'Los Angeles',
      time: '12:00'
    }
  }
};

// Mock Weather Data
const WEATHER = {
  'Osaka': [
    { date: '2025-11-29', temp: 18, condition: 'Sunny', icon: '☀️' },
    { date: '2025-11-30', temp: 17, condition: 'Cloudy', icon: '☁️' },
    { date: '2025-12-01', temp: 15, condition: 'Rain', icon: '🌧️' },
  ],
  'Fukuoka': [
    { date: '2025-11-29', temp: 19, condition: 'Sunny', icon: '☀️' },
    { date: '2025-11-30', temp: 20, condition: 'Sunny', icon: '☀️' },
    { date: '2025-12-01', temp: 18, condition: 'Cloudy', icon: '☁️' },
  ],
  'Los Angeles': [
    { date: '2025-11-29', temp: 25, condition: 'Sunny', icon: '☀️' },
    { date: '2025-11-30', temp: 24, condition: 'Sunny', icon: '☀️' },
    { date: '2025-12-01', temp: 22, condition: 'Partly Cloudy', icon: '⛅' },
  ]
};

// Real API Configuration
const API_KEYS = {
  AVIATIONSTACK: import.meta.env.VITE_AVIATIONSTACK_KEY || '', // Get key from https://aviationstack.com/
  OPENWEATHER: import.meta.env.VITE_OPENWEATHER_KEY || ''      // Get key from https://openweathermap.org/
};

const MOCK_DELAY_MS = 800;

// ---------------------------------------------------------------------------
// Pure helpers (network-free, unit-testable). Keeping the data-shaping logic
// out of the async functions lets the test suite cover the real-API code paths
// without hitting the network — which is what makes the self-healing CI
// meaningful (a regression here fails a fast, deterministic test).
// ---------------------------------------------------------------------------

// Map an OpenWeatherMap "main" condition to a display icon.
export const getWeatherIcon = (condition) => {
  switch (String(condition).toLowerCase()) {
    case 'clear': return '☀️';
    case 'clouds': return '☁️';
    case 'rain': return '🌧️';
    case 'drizzle': return '🌦️';
    case 'thunderstorm': return '⛈️';
    case 'snow': return '❄️';
    default: return '🌫️';
  }
};

// Best-effort city name from an IANA timezone (e.g. "America/Los_Angeles").
// Note: this is an approximation — the airport's timezone city is not always
// the destination city. Tracked as a known limitation for the agent pipeline.
export const cityFromTimezone = (timezone) => {
  if (!timezone || typeof timezone !== 'string' || !timezone.includes('/')) {
    return timezone || '';
  }
  return timezone.split('/').pop().replace(/_/g, ' ');
};

// Normalize a raw AviationStack flight record into our internal shape.
export const mapAviationStackFlight = (flight) => ({
  flightNumber: flight.flight.iata,
  airline: flight.airline.name,
  departure: {
    airport: flight.departure.iata,
    airportName: flight.departure.airport,
    city: cityFromTimezone(flight.departure.timezone),
    time: flight.departure.scheduled.split('T')[1].substring(0, 5)
  },
  arrival: {
    airport: flight.arrival.iata,
    airportName: flight.arrival.airport,
    city: cityFromTimezone(flight.arrival.timezone),
    time: flight.arrival.scheduled.split('T')[1].substring(0, 5)
  }
});

// Collapse OpenWeatherMap's 3-hourly list into one entry per day.
export const aggregateForecast = (list, days = 3) => {
  const dailyForecast = [];
  for (let i = 0; i < list.length; i += 8) { // ~every 24h (8 * 3h)
    const item = list[i];
    dailyForecast.push({
      date: item.dt_txt.split(' ')[0],
      temp: Math.round(item.main.temp),
      condition: item.weather[0].main,
      icon: getWeatherIcon(item.weather[0].main)
    });
  }
  return dailyForecast.slice(0, days);
};

// ---------------------------------------------------------------------------
// Data-fetching functions: real API first when a key is present, otherwise a
// mock fallback so the app keeps working without keys.
// ---------------------------------------------------------------------------

export const getFlightDetails = async (flightNumber) => {
  // Try Real API first if key exists
  if (API_KEYS.AVIATIONSTACK) {
    try {
      const response = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${API_KEYS.AVIATIONSTACK}&flight_iata=${flightNumber}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        return mapAviationStackFlight(data.data[0]);
      }
    } catch (error) {
      console.warn('Failed to fetch from AviationStack, falling back to mock data:', error);
    }
  }

  // Fallback to Mock Data
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const flight = FLIGHTS[flightNumber.toUpperCase()];
      if (flight) {
        resolve(flight);
      } else {
        reject(new Error('Flight not found'));
      }
    }, MOCK_DELAY_MS);
  });
};

export const getWeather = async (city, days = 3) => {
  // Try Real API first if key exists
  if (API_KEYS.OPENWEATHER) {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&cnt=${days * 8}&appid=${API_KEYS.OPENWEATHER}`);
      const data = await response.json();

      if (data.list) {
        return aggregateForecast(data.list, days);
      }
    } catch (error) {
      console.warn('Failed to fetch from OpenWeatherMap, falling back to mock data:', error);
    }
  }

  // Fallback to Mock Data
  return new Promise((resolve) => {
    setTimeout(() => {
      const forecast = WEATHER[city] || [];
      resolve(forecast.slice(0, days));
    }, MOCK_DELAY_MS);
  });
};
