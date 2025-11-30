import React from 'react';

import { useTranslation } from 'react-i18next';

const FlightInfo = ({ flight, type }) => {
    const { t } = useTranslation();
    if (!flight) return null;

    return (
        <div className="card flight-card">
            <div className="flight-header">
                <span className="badge">{t(type.toLowerCase())}</span>
                <span className="flight-number">{flight.flightNumber}</span>
            </div>
            <div className="flight-route">
                <div className="airport">
                    <div className="code">{flight.departure.airport}</div>
                    <div className="time">{flight.departure.time}</div>
                    <div className="city">{flight.departure.city}</div>
                </div>
                <div className="route-line">
                    <div className="plane-icon">✈️</div>
                </div>
                <div className="airport">
                    <div className="code">{flight.arrival.airport}</div>
                    <div className="time">{flight.arrival.time}</div>
                    <div className="city">{flight.arrival.city}</div>
                </div>
            </div>
            <div className="airline">{flight.airline}</div>
        </div>
    );
};

export default FlightInfo;
