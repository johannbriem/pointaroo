// src/components/ThemeSelector.jsx
import React, { useEffect, useState } from 'react';

export default function ThemeSelector({ userId }) {
  const [currentTheme, setCurrentTheme] = useState('modern'); // Default theme

  // In a real app, you'd fetch user's preferred theme or role
  // For demonstration, let's assume a simple toggle or selection
  useEffect(() => {
    // Example: Load theme from localStorage or user settings
    const savedTheme = localStorage.getItem('app-theme') || 'modern';
    setCurrentTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);

    // Example: Determine theme based on user role (e.g., from userId)
    // This is where you'd integrate your user role logic
    // if (userId && userId === 'admin123') { // Replace with actual admin ID check
    //   setCurrentTheme('modern');
    //   document.body.setAttribute('data-theme', 'modern');
    // } else if (userId && userId === 'kid456') { // Replace with actual kid ID check
    //   setCurrentTheme('kids');
    //   document.body.setAttribute('data-theme', 'kids');
    // }
  }, [userId]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme); // Save preference
  };

  // You can add a button or dropdown to switch themes
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