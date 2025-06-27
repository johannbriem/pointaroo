// src/components/ThemeSelector.jsx
import React, { useEffect, useState } from 'react';

export default function ThemeSelector({ user }) {
  const [currentTheme, setCurrentTheme] = useState('modern'); // Default theme

  useEffect(() => {
    if (user) {
      const userRole = user.app_metadata?.role;
      let themeToApply = 'modern'; // Default for admin/parent

      if (userRole !== 'admin') { // Assuming non-admin users are kids or general users
        themeToApply = 'kids';
      }

      setCurrentTheme(themeToApply);
      document.body.setAttribute('data-theme', themeToApply);
      localStorage.setItem('app-theme', themeToApply); // Save preference
    }
  }, [user]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme); // Save preference
  };

  // You can keep these buttons for manual override or testing, or remove them
  // if themes are strictly role-based and not user-selectable.
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleThemeChange('modern')}
        className={`px-3 py-1 rounded-md text-sm ${currentTheme === 'modern' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
      >
        Modern
      </button>
      <button
        onClick={() => handleThemeChange('kids')}
        className={`px-3 py-1 rounded-md text-sm ${currentTheme === 'kids' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-800'}`}
      >
        Kids
      </button>
      {/* Dark mode toggle can also be here, toggling a 'dark' class on body */}
      <button
        onClick={() => document.body.classList.toggle('dark')}
        className="px-3 py-1 rounded-md text-sm bg-gray-700 text-white"
      >
        Toggle Dark
      </button>
    </div>
  );
}
