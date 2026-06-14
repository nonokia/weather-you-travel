import React from 'react';
import { useTranslation } from 'react-i18next';
import './RecentSearches.css';

const RecentSearches = ({ searches, onSelect }) => {
    const { t } = useTranslation();

    if (!searches || searches.length === 0) {
        return null;
    }

    return (
        <div className="recent-searches">
            <span className="recent-searches-label">{t('recentSearches')}</span>
            {searches.map((s) => (
                <button key={s} className="recent-chip" onClick={() => onSelect(s)}>
                    {s}
                </button>
            ))}
        </div>
    );
};

export default RecentSearches;
