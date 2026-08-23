/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const defaultSettings = {
    allowDownloads: true,
    blindAudit: false,
    enableChat: true,
    requireRejectionReason: false,
    showLedger: true,
};

export const SettingsContext = createContext({
    settings: defaultSettings,
    isLoading: true,
    error: null,
    refreshSettings: async () => {},
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings({ ...defaultSettings, ...response.data });
            setError(null);
        } catch (requestError) {
            setError(requestError);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, isLoading, error, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);