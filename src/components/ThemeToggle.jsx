import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useSettings();
    const isLight = theme === 'light';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
            title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
            className="theme-toggle"
        >
            {isLight ? <Moon size={17} /> : <Sun size={17} />}
        </button>
    );
};

export default ThemeToggle;