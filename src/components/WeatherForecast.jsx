import React from 'react';

import { useTranslation } from 'react-i18next';

const WeatherForecast = ({ weather, city }) => {
    const { t } = useTranslation();
    if (!weather || weather.length === 0) return null;

    return (
        <div className="card weather-card">
            <h3>{t('weatherForecast', { city })}</h3>
            <div className="forecast-grid">
                {weather.map((day, index) => (
                    <div key={index} className="forecast-day">
                        <div className="date">{day.date}</div>
                        <div className="icon">{day.icon}</div>
                        <div className="temp">{day.temp}°C</div>
                        <div className="condition">{day.condition}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherForecast;
