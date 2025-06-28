// src/components/ThemeSelector.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Helper to get the initial theme from localStorage or system preference
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('app-theme');
    if (typeof storedPrefs === 'string') {
      return storedPrefs;
    }

    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'light'; // Default theme
};

export default function ThemeSelector({ user }) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(getInitialTheme);

  const baseThemes = [
    { id: 'light', label: t('navbar.lightMode') },
    { id: 'dark', label: t('navbar.darkMode') },
  ];

  const kidThemes = [
    { id: 'space', label: t('navbar.spaceTheme') },
    { id: 'jungle', label: t('navbar.jungleTheme') },
    { id: 'robot', label: t('navbar.robotTheme') },
    { id: 'ocean', label: t('navbar.oceanTheme') },
  ];

  const isKid = user?.app_metadata?.role !== 'admin';

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2 text-[--text-primary]">{t('navbar.themeMode')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {baseThemes.map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                theme === themeOption.id
                  ? 'bg-[--accent-primary] text-[--button-text]'
                  : 'bg-[--background-secondary] text-[--text-primary] hover:bg-[--accent-secondary] hover:text-[--button-text]'
              }`}
            >
              {themeOption.label}
            </button>
          ))}
        </div>
      </div>

      {isKid && (
        <div>
          <h3 className="font-semibold text-lg mb-2 text-[--text-primary]">{t('navbar.kidThemes')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {kidThemes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  theme === themeOption.id
                    ? 'bg-[--accent-primary] text-[--button-text]'
                    : 'bg-[--background-secondary] text-[--text-primary] hover:bg-[--accent-secondary] hover:text-[--button-text]'
                }`}
              >
                {themeOption.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
