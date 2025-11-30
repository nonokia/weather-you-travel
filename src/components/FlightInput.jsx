import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

const FlightInput = ({ onSearch, isLoading }) => {
    const { t } = useTranslation();
    const [departureFlight, setDepartureFlight] = useState('');
    const [returnFlight, setReturnFlight] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (departureFlight) {
            onSearch(departureFlight, returnFlight);
        }
    };

    return (
        <div className="card input-card">
            <h2>{t('planTrip')}</h2>
            <form onSubmit={handleSubmit} className="flight-form">
                <div className="form-group">
                    <label htmlFor="departure">{t('departureFlight')}</label>
                    <input
                        type="text"
                        id="departure"
                        value={departureFlight}
                        onChange={(e) => setDepartureFlight(e.target.value)}
                        placeholder={t('flightNumberPlaceholder')}
                        required
                        className="input-field"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="return">{t('returnFlight')}</label>
                    <input
                        type="text"
                        id="return"
                        value={returnFlight}
                        onChange={(e) => setReturnFlight(e.target.value)}
                        placeholder={t('flightNumberPlaceholder')}
                        className="input-field"
                    />
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? t('searching') : t('getInfo')}
                </button>
            </form>
        </div>
    );
};

export default FlightInput;
