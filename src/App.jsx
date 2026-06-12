import React, { useState } from 'react';
import FlightInput from './components/FlightInput';
import FlightInfo from './components/FlightInfo';
import WeatherForecast from './components/WeatherForecast';
import Skeleton from './components/Skeleton';
import { getFlightDetails, getWeather } from './services/api';
import { isValidFlightNumber } from './utils/flightValidation';

import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  const [departureData, setDepartureData] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (depFlightNum, retFlightNum) => {
    setError('');
    if (!isValidFlightNumber(depFlightNum)) {
      setError(t('invalidFlightNumber'));
      return;
    }
    if (retFlightNum && !isValidFlightNumber(retFlightNum)) {
      setError(t('invalidFlightNumber'));
      return;
    }
    setLoading(true);
    setDepartureData(null);
    setReturnData(null);
    setWeatherData(null);

    try {
      // Fetch Departure Flight
      const depFlight = await getFlightDetails(depFlightNum);
      setDepartureData(depFlight);

      // If Return Flight is provided
      if (retFlightNum) {
        const retFlight = await getFlightDetails(retFlightNum);
        setReturnData(retFlight);

        // Fetch Weather for the destination during the stay
        // Assuming stay is from departure arrival to return departure
        // For mock, we just fetch weather for the destination city
        const weather = await getWeather(depFlight.arrival.city);
        setWeatherData(weather);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(t('flightNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{t('appTitle')}</h1>
        <p>{t('appSubtitle')}</p>
      </header>

      <main className="main-content">
        <FlightInput onSearch={handleSearch} isLoading={loading} />

        {error && <div className="error-message">{error}</div>}

        <div className="results-container">
          {loading ? (
            <>
              <div className="card flight-card">
                <div className="flight-header">
                  <Skeleton style={{ width: '60px', height: '20px' }} />
                  <Skeleton style={{ width: '80px', height: '24px' }} />
                </div>
                <div className="flight-route">
                  <div className="airport">
                    <Skeleton style={{ width: '80px', height: '40px', margin: '0 auto' }} />
                    <Skeleton style={{ width: '100px', height: '20px', margin: '0.5rem auto' }} />
                  </div>
                  <div className="route-line">
                    <Skeleton style={{ width: '100%', height: '2px' }} />
                  </div>
                  <div className="airport">
                    <Skeleton style={{ width: '80px', height: '40px', margin: '0 auto' }} />
                    <Skeleton style={{ width: '100px', height: '20px', margin: '0.5rem auto' }} />
                  </div>
                </div>
                <Skeleton style={{ width: '150px', height: '20px', margin: '1rem auto 0' }} />
              </div>
              <div className="card weather-card">
                <Skeleton style={{ width: '200px', height: '30px', margin: '0 auto 1.5rem' }} />
                <div className="forecast-grid">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="forecast-day">
                      <Skeleton style={{ width: '60px', height: '15px', margin: '0 auto' }} />
                      <Skeleton style={{ width: '40px', height: '40px', margin: '0.5rem auto' }} />
                      <Skeleton style={{ width: '50px', height: '24px', margin: '0 auto' }} />
                      <Skeleton style={{ width: '80px', height: '15px', margin: '0 auto' }} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {departureData && (
                <div className="flight-section">
                  <FlightInfo flight={departureData} type="Departure" />
                </div>
              )}

              {returnData && (
                <div className="flight-section">
                  <FlightInfo flight={returnData} type="Return" />
                </div>
              )}

              {weatherData && (
                <div className="weather-section">
                  <WeatherForecast weather={weatherData} city={departureData.arrival.city} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
