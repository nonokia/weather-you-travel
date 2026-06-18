import React from 'react';

import { useTranslation } from 'react-i18next';
import { formatTemperature } from '../utils/temperature';
import { formatForecastDate } from '../utils/formatDate';

const WeatherForecast = ({ weather, city, unit, onToggleUnit }) => {
    const { t, i18n } = useTranslation();
    if (!weather || weather.length === 0) return null;

    return (
        <div className="card weather-card">
            <h3>{t('weatherForecast', { city })}</h3>
            <div className="temp-unit-toggle" aria-label={t('temperatureUnit')}>
                <button type="button" className={unit !== 'F' ? 'active' : ''} onClick={() => unit !== 'C' && onToggleUnit()}>°C</button>
                <button type="button" className={unit === 'F' ? 'active' : ''} onClick={() => unit !== 'F' && onToggleUnit()}>°F</button>
            </div>
            <div className="forecast-grid">
                {weather.map((day, index) => (
                    <div key={index} className="forecast-day">
                        <div className="date">{formatForecastDate(day.date, i18n.language)}</div>
                        <div className="icon">{day.icon}</div>
                        <div className="temp">{formatTemperature(day.temp, unit)}</div>
                        <div className="condition">{day.condition}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherForecast;
