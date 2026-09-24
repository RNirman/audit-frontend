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

const getInitialTheme = () => localStorage.getItem('theme') || 'light';

export const SettingsContext = createContext({
    settings: defaultSettings,
    theme: 'dark',
    toggleTheme: () => {},
    isLoading: true,
    error: null,
    refreshSettings: async () => {},
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [theme, setTheme] = useState(getInitialTheme);
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

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');

    return (
        <SettingsContext.Provider value={{ settings, isLoading, error, refreshSettings, theme, toggleTheme }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);