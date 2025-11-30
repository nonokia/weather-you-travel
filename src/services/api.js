
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

// ... (Mock Data remains same) ...

export const getFlightDetails = async (flightNumber) => {
  // Try Real API first if key exists
  if (API_KEYS.AVIATIONSTACK) {
    try {
      const response = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${API_KEYS.AVIATIONSTACK}&flight_iata=${flightNumber}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const flight = data.data[0];
        return {
          flightNumber: flight.flight.iata,
          airline: flight.airline.name,
          departure: {
            airport: flight.departure.iata,
            airportName: flight.departure.airport,
            city: flight.departure.timezone.split('/')[1].replace('_', ' '), // Approximate city from timezone
            time: flight.departure.scheduled.split('T')[1].substring(0, 5)
          },
          arrival: {
            airport: flight.arrival.iata,
            airportName: flight.arrival.airport,
            city: flight.arrival.timezone.split('/')[1].replace('_', ' '),
            time: flight.arrival.scheduled.split('T')[1].substring(0, 5)
          }
        };
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
    }, 800);
  });
};

export const getWeather = async (city, days = 3) => {
  // Try Real API first if key exists
  if (API_KEYS.OPENWEATHER) {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&cnt=${days * 8}&appid=${API_KEYS.OPENWEATHER}`);
      const data = await response.json();

      if (data.list) {
        // Process 3-hour forecast into daily summary (simplified)
        const dailyForecast = [];
        for (let i = 0; i < data.list.length; i += 8) { // Approx every 24h
          const item = data.list[i];
          dailyForecast.push({
            date: item.dt_txt.split(' ')[0],
            temp: Math.round(item.main.temp),
            condition: item.weather[0].main,
            icon: getWeatherIcon(item.weather[0].main)
          });
        }
        return dailyForecast.slice(0, days);
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
    }, 800);
  });
};

const getWeatherIcon = (condition) => {
  switch (condition.toLowerCase()) {
    case 'clear': return '☀️';
    case 'clouds': return '☁️';
    case 'rain': return '🌧️';
    case 'snow': return '❄️';
    default: return 'tj';
  }
};
